// import files locally
const Wallet = require("../wallet/index");
const Block = require('../blockchain/block');
const Transaction = require("../wallet/transaction");


class Miner {
  constructor(blockchain, transactionPool, wallet, peers) {
    this.currentJob = [];
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.peers = peers;
    this.blockchainWallet = this.blockchain.blockchainWallet;
  }

  solveBlock(job){
    // console.log("job ", job);
    let hash;
    let transactions = job.transactions;
    const dateCreated = job.timeStamp;
    const lastBlock = this.blockchain.chain[this.blockchain.chain.length -1];
    const prevBlockHash = lastBlock.blockHash;
    const index = job.index;
    let difficulty = job.difficulty;
    let _nonce = 0;

    // add reward transaction
    const rewardTransaction =  Transaction.rewardTransaction(this.wallet, this.blockchainWallet, this.blockchain, this.transactionPool, BigInt(0));
    transactions.unshift(rewardTransaction);

    // modify transactions
    transactions.forEach(transaction => {
      transaction.minedInBlockIndex = index;
      transaction.transferSuccessful = true;
      transaction.outputs[0] = {newSenderConfirmedBalance: transaction.outputs[0].newSenderPendingBalance, address: transaction.outputs[0].address};
    });
    // add mining rewards to reward transaction
    transactions[0].outputs[1].sentAmount = BigInt(job.expectedReward);

    // pow
    do {
      _nonce++;
      hash = Block.hash(
        dateCreated,
        prevBlockHash,
        transactions,
        _nonce,
        difficulty
      );
      // check if we have the right # of zeros (P.O.W)
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));

    const potentialBlock = {index: index, transactions: transactions, difficulty: difficulty, prevBlockHash: prevBlockHash, minedBy: this.wallet.address, blockDataHash: job.blockDataHash, nonce: _nonce, dateCreated: dateCreated, hash: hash};

    return potentialBlock;
  }


  mineDebug() {
    let rewards = BigInt(0);
    // verify transaction pool, add mining reward, add new block to chain
    const validTransactions = this.transactionPool.validTransactions();

    const index = this.blockchain.chain.length;
    // console.log(index);
   
    if (validTransactions) {
      validTransactions.unshift(
        Transaction.rewardTransaction(this.wallet, this.blockchainWallet, this.blockchain, this.transactionPool, BigInt(0))
      );
      // console.log(validTransactions);
      
      validTransactions.forEach(transaction => {
        // tally rewards for miner from each trans
        transaction.outputs.forEach(output => {
          if(output.gas){
            rewards += output.gas;
          }
        });
        transaction.minedInBlockIndex = index;
        transaction.transferSuccessful = true;
        transaction.outputs[0] = {newSenderConfirmedBalance: transaction.outputs[0].newSenderPendingBalance, address: transaction.outputs[0].address};
      });
      // console.log(`rewards ${rewards}`);

      // create new block with valid transactions
      validTransactions[0].outputs[1].sentAmount += rewards;
      const block = this.blockchain.addBlockDebug(validTransactions, this.wallet.address);
    

      // broadcast to peers and update chain with new block
      this.blockchain.updateTransactionSafeOrConfirmed(index);
      this.peers.syncChain();
      this.transactionPool.clear();
      this.peers.broadcastClearTransactions();

      return block;
    }
    return;
  }
}

module.exports = Miner;
