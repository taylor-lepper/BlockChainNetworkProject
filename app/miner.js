// import files locally
const Wallet = require("../wallet/index");
const Transaction = require("../wallet/transaction");
const blockchainWallet = Wallet.blockchainWallet();

class Miner {
  constructor(blockchain, transactionPool, wallet, p2pserver) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pserver = p2pserver;
  }

  mine() {
    // create reward transaction and add to transaction pool
    const validTransactions = this.transactionPool.validTransactions();
    // console.log("blockchain wallet address " + blockchainWallet.address);
    if (validTransactions) {
      validTransactions.push(
        Transaction.rewardTransaction(this.wallet.address, blockchainWallet, this.blockchain)
      );


      // create new block with those transactions
      const block = this.blockchain.addBlock(validTransactions, this.wallet.address);
    

      // broadcast to peers and update chain with new block
      this.p2pserver.syncChain();
      this.transactionPool.clear();
      this.p2pserver.broadcastClearTransactions();

      return block;
    }
    return;
  }
}

module.exports = Miner;
