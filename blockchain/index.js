const Block = require("./block");
const Wallet = require("../wallet/index");
const TransactionPool = require("../wallet/transaction-pool");
const Transaction = require("../wallet/transaction");
const { FAUCET_TRANSACTION, DIFFICULTY } = require("../config");

class Blockchain {
  constructor() {
    this.faucetWallet = Wallet.faucetWallet();
    // this.faucetWallet.balance = FAUCET_TRANSACTION.amount;
    this.chain = [Block.genesis(FAUCET_TRANSACTION)];
    this.blockchainWallet = Wallet.blockchainWallet();
    this.wallets = [this.blockchainWallet, this.faucetWallet];
    this.cumulativeDifficulty = DIFFICULTY;
    this.miningPool = new Map();
    this.pendingDifficulty = [];
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  validateBlock(blockInfo, transactionPool, peers, miner) {
    // console.log(blockInfo);
    const hash = blockInfo.hash;

    let miningJob = this.miningPool.get(blockInfo.blockDataHash);
    // console.log(miningJob);
    if (hash.startsWith("0".repeat(miningJob.difficulty))) {
      // console.log("verified hash");

      // check index to see if 1st one to solve
      if (blockInfo.index === this.getLatestBlock().index + 1) {
        const block = new Block(
          blockInfo.index,
          blockInfo.transactions,
          blockInfo.difficulty,
          blockInfo.prevBlockHash,
          blockInfo.minedBy,
          blockInfo.blockDataHash,
          blockInfo.nonce,
          blockInfo.dateCreated,
          blockInfo.hash
        );
        this.chain.push(block);
        console.log(`added block ${blockInfo.index} to the chain!`);
        this.pendingDifficulty = [];
        this.cumulativeDifficulty = this.calculateCumulativeDifficulty(this.chain);
        this.updateTransactionSafeOrConfirmed(blockInfo.index);
        peers.syncChain();
        transactionPool.clear();
        peers.broadcastClearTransactions();
        miner.currentJob = [];
        this.miningPool.clear();
        return {
          message: "New block added to the blockchain!",
          reward: block.transactions[0].outputs[1].sentAmount + " micro-coins",
          blockchain: this.chain,
        };
      } else {
        miner.currentJob = [];
        this.miningPool.delete(blockInfo.blockDataHash);
        transactionPool.clear()
        return {
          errorCode: 404,
          message: `Block at index: ${blockInfo.index} has already been mined!`,
        };
      }
    }
    miner.currentJob = [];
    this.miningPool.delete(blockInfo.blockDataHash);
    return { errorCode: 404, message: `Invalid proof of work: ${hash}` };
  }

  setDifficulty(difficulty){
    // console.log("hmm");
    this.pendingDifficulty = [difficulty];
  }

  createMiningJob(transactionPool, minedBy, blockchain, peers) {
    const lastBlock = this.getLatestBlock();
  
    let block = Block.prepareBlockCandidate(
      lastBlock,
      transactionPool,
      minedBy, 
      blockchain,
      peers
    );
   
    this.miningPool.set(block.blockDataHash, block);
    return block;
  }

  addBlockDebug(transactions, minedBy) {
    const block = Block.mineBlock(
      this.chain[this.chain.length - 1],
      transactions,
      minedBy
    );
    this.chain.push(block);
    // console.log("chain " + this.chain + "\n");
    console.log("New block added to chain!");
    this.cumulativeDifficulty = this.calculateCumulativeDifficulty(this.chain);
    return block;
  }

  updateWallets(newWallets) {
    if (newWallets.length > 0) {
      newWallets.forEach((wallet) => this.wallets.push(wallet));
    }
    const uniqueIds = [];

    const unique = this.wallets.filter((wallet) => {
      const isDuplicate = uniqueIds.includes(wallet.address);

      if (!isDuplicate) {
        uniqueIds.push(wallet.address);
        return true;
      }
      return false;
    });
    this.wallets = unique;
    // console.log(this.wallets);
  }

  replaceWallets(newWallets) {
    console.log("Syncing all wallets");
    this.updateWallets(newWallets);
  }

  resetWallets(newWallets) {
    this.wallets = [];
    console.log("Resetting the current wallets");
    newWallets.forEach((wallet) => {
      if (wallet.address === "blockchain-reward-wallet") {
        wallet.safeBalance = BigInt(1000000000000);
        wallet.confirmedBalance = BigInt(1000000000000);
        wallet.pendingBalance = BigInt(1000000000000);
      } else if (wallet.address === "faucet-wallet") {
        wallet.safeBalance = BigInt(9999999999999);
        wallet.confirmedBalance = BigInt(9999999999999);
        wallet.pendingBalance = BigInt(9999999999999);
      } else {
        wallet.safeBalance = BigInt(0);
        wallet.confirmedBalance = BigInt(0);
        wallet.pendingBalance = BigInt(0);
      }
      this.wallets.push(wallet);
    });
    // console.log("new ones", this.wallets);
  }

  isValidChain(chain) {
    if (
      JSON.stringify(chain[0]) !==
      JSON.stringify(Block.genesis(FAUCET_TRANSACTION))
    ) {
      console.log("Invalid chain (Genesis)");
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];
      var {
        index,
        transactions,
        difficulty,
        prevBlockHash,
        minedBy,
        dateCreated,
      } = block;

      // remove mining reward transaction (wasn't there when it was originally hashed)
      transactions.shift();

      const hash = Block.blockHash(
        JSON.stringify({
          index: index,
          transactions: transactions,
          difficulty: difficulty,
          prevBlockHash: prevBlockHash,
          minedBy: minedBy,
          timeStamp: dateCreated,
        })
      );
      // console.log(block.blockDataHash);
      // console.log(hash);
      if (
        block.prevBlockHash !== lastBlock.blockHash ||
        block.blockDataHash !== hash
      ) {
        console.log("Invalid chain (Hashes)");
        return false;
      }
    }
    return true;
  }

  replaceChain(newChain) {
    if (this.calculateCumulativeDifficulty(newChain) <= this.chain.cumulativeDifficulty) {
      console.log(
        "Recieved chain has lower cumulativeDifficulty than the current chain\nKeeping current chain."
      );
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log("Recieved chain is invalid");
      return;
    }

    console.log("Replacing the current chain with new chain");
    this.chain = newChain;
    this.miningPool.clear();
  }

  resetChain(chain) {
    this.chain = chain;
  }

  updateTransactionSafeOrConfirmed(index) {
    if (index > 6) {
      // console.log("must be the 7th");
      let indexToAdjust = this.getLatestBlock().index - 6;
      // console.log(indexToAdjust);
      let blockTransactionsToAdjust = this.chain[indexToAdjust].transactions;
      // console.log(blockTransactionsToAdjust);
      blockTransactionsToAdjust.forEach((transaction) => {
        transaction.outputs[0] = {
          newSenderSafeBalance:
            transaction.outputs[0].newSenderConfirmedBalance,
          address: transaction.outputs[0].address,
        };
      });
    }
  }
  calculateCumulativeDifficulty(chain) {
    let counter = 0;
    for (let i = 0; i < chain.length; i++) {
      let currBlock = chain[i];
      counter += 16 ^ currBlock.difficulty;
    }
    return counter;
  }

  calculateConfirmedTransactions() {
    let counter = 0;
    for (let i = 1; i < this.chain.length; i++) {
      let currBlock = this.chain[i];
      counter += currBlock.transactions.length;
    }
    return counter;
  }

  findTransactionByAddress(addressToFind) {
    let matchingTransactions = [];
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        // console.log(transaction);
        if (
          transaction.outputs[0].address === addressToFind ||
          transaction.outputs[1].address === addressToFind
        ) {
          // console.log("matching address");
          matchingTransactions.push(transaction);
        }
      }
    }
    return matchingTransactions.sort((a, b) =>
      a.input.dateCreated > b.input.dateCreated ? 1 : -1
    );
  }

  findConfirmedTransactions() {
    let transactionsList = [];
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        // console.log(transaction);
        transactionsList.push(transaction);
      }
    }
    return transactionsList.sort((a, b) =>
      a.input.dateCreated > b.input.dateCreated ? 1 : -1
    );
  }

  findTransactionByHash(hashToFind) {
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        // console.log(transaction);
        if (transaction.input.transactionHash === hashToFind) {
          console.log("matching hash");
          return transaction;
        }
      }
    }
    return `No matching transaction found for hash '${hashToFind}'`;
  }
}

module.exports = Blockchain;
