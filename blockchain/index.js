const Block = require("./block");
const Wallet = require("../wallet/index");
const { FAUCET_TRANSACTION, DIFFICULTY } = require("../config");

class Blockchain {
  constructor() {
    this.faucetWallet = Wallet.faucetWallet();
    // this.faucetWallet.balance = FAUCET_TRANSACTION.amount;
    this.chain = [Block.genesis(FAUCET_TRANSACTION)];
    this.blockchainWallet = Wallet.blockchainWallet();
    this.wallets = [this.blockchainWallet, this.faucetWallet];
    this.cumulativeDifficulty = DIFFICULTY;
    this.miningPool = [];
  }

  updateWallets(newWallets) {
    // console.log("newWallets");
    // console.log(newWallets);
    // console.log("newWallets end");
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

  addBlock(transactions, minedBy) {
    const block = Block.mineBlock(
      this.chain[this.chain.length - 1],
      transactions,
      minedBy
    );
    this.chain.push(block);
    console.log("chain " + this.chain + "\n");
    this.cumulativeDifficulty = this.calculateCumulativeDifficulty();
    return block;
  }

  isValidChain(chain) {
    if (
      JSON.stringify(chain[0]) !==
      JSON.stringify(Block.genesis(FAUCET_TRANSACTION))
    ) {
      console.log("Invalid chain (Genesis");
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];
      const { index, transactions, difficulty, prevBlockHash, minedBy } =
        block;
      
      const hash = Block.blockHash(
        index, transactions, difficulty, prevBlockHash, minedBy
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
    if (newChain.cumulativeDifficulty <= this.chain.cumulativeDifficulty) {
      console.log("Recieved chain has lower cumulativeDifficulty than the current chain\nKeeping current chain.");
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log("Recieved chain is invalid");
      return;
    }
   
    console.log("Replacing the current chain with new chain");
    this.chain = newChain;
  }

  resetChain(chain) {
    this.chain = chain;
  }

  updateTransactionSafeOrConfirmed(index){
    if(index > 6){
      // console.log("must be the 7th");
      let indexToAdjust = this.chain[this.chain.length -1].index - 6;
      // console.log(indexToAdjust);
      let blockTransactionsToAdjust = this.chain[indexToAdjust].transactions;
      // console.log(blockTransactionsToAdjust);
      blockTransactionsToAdjust.forEach(transaction => {
        transaction.outputs[0] = {newSenderSafeBalance: transaction.outputs[0].newSenderConfirmedBalance, address: transaction.outputs[0].address};
      }); 
    }
  }
  calculateCumulativeDifficulty(){
    let counter = 0;
    for(let i = 0; i < this.chain.length; i++){
      let currBlock = this.chain[i];
      counter += 16 ^ (currBlock.difficulty);
    }
    return counter;
  }

  calculateConfirmedTransactions(){
    let counter = 0;
    for(let i = 1; i < this.chain.length; i++){
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
