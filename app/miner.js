// import files locally
const Wallet = require("../wallet/index");
const Transaction = require("../wallet/transaction");


class Miner {
  constructor(blockchain, transactionPool, wallet, peers, blockchainWallet) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.peers = peers;
    this.blockchainWallet = blockchainWallet;
  }

  mine() {
    // create reward transaction and add to transaction pool
    const validTransactions = this.transactionPool.validTransactions();
    // console.log("blockchain wallet address " + blockchainWallet.address);
    if (validTransactions) {
      validTransactions.push(
        Transaction.rewardTransaction(this.wallet, this.blockchainWallet, this.blockchain)
      );


      // create new block with those transactions
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
