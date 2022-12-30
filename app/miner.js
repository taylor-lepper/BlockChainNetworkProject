// import files locally
const Wallet = require("../wallet/index");
const Transaction = require("../wallet/transaction");


class Miner {
  constructor(blockchain, transactionPool, wallet, peers) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.peers = peers;
    this.blockchainWallet = this.blockchain.blockchainWallet;
  }

  mine() {
    // verify transaction pool, add mining reward, add new block to chain
    const validTransactions = this.transactionPool.validTransactions();

    const index = this.blockchain.chain.length;
    // console.log(index);
   
    if (validTransactions) {
      validTransactions.push(
        Transaction.rewardTransaction(this.wallet, this.blockchainWallet, this.blockchain, this.transactionPool, BigInt(0))
      );
      // console.log(validTransactions);

      validTransactions.forEach(transaction => {
        transaction.minedInBlockIndex = index;
        transaction.transferSuccessful = true;
      });
      // create new block with valid transactions
      const block = this.blockchain.addBlock(validTransactions, this.wallet.address);
    

      // broadcast to peers and update chain with new block
      this.peers.syncChain();
      this.transactionPool.clear();
      this.peers.broadcastClearTransactions();

      return block;
    }
    return;
  }
}

module.exports = Miner;
