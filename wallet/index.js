const { INITIAL_BALANCE } = require("../config");
const ChainUtil = require("../chain-util");
const Transaction = require("./transaction");
const Peers = require("../app/peers");

class Wallet {
  constructor(balance, name) {
    this.name = name || ChainUtil.randomNameGenerator();
    this.balance = BigInt(balance);
    this.keyPair = ChainUtil.genKeyPair();
    this.privateKey = "0x" + this.keyPair.getPrivate("hex");
    this.publicKey = "0x" + this.keyPair.getPublic().encode("hex");
    this.address = "0x" + ChainUtil.computeAddressFromPrivKey(this.privateKey);
    this.publicKeyCompressed = ChainUtil.compressPublicKey(this.publicKey);
  }

  toString() {
    return `Wallet -
        name        : ${this.name}
        balance     : ${this.balance}
        publicKey   : ${this.publicKeyCompressed.toString()}
        privateKey  : ${this.privateKey.toString()}
        address     : ${this.address.toString()}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  wallletByPort(){
    return this.wallet;
  }

  pushIt(blockchain, peers){
    blockchain.wallets.push(this);
    peers.syncWallets();
  }

  static blockchainWallet() {
    const blockchainWallet = new this(BigInt(1000000000000), "Mining Rewards Wallet from Genesis");
    blockchainWallet.address = "blockchain-reward-wallet";
    return blockchainWallet;
  }

  static faucetWallet() {
    const faucetWallet = new this(BigInt(99999999999), "Faucet Wallet ");
    faucetWallet.address = "faucet-wallet";
    return faucetWallet;
  } 

  createTransaction(senderWallet, recipient, amount, blockchain, transactionPool, gas) {
    // this.balance = this.calculateBalance(blockchain);
    if (BigInt(amount > senderWallet.balance)) {
      console.log(`Amount ${amount} exceeds the current balance: ${senderWallet.balance}`);
      return;
    }
    // console.log(transactionPool);
    let transaction = transactionPool.isExistingTransaction(this.address);
    if (transaction) {
      // adds to existing outputs
      console.log("existing transaction to update");
      transaction.update(this, recipient, amount, blockchain, gas);
    } else {
      // creates new transaction and updates the transaction pool

      transaction = Transaction.newTransaction(senderWallet, recipient, amount, blockchain, gas);
      //   console.log(transaction);
      transactionPool.updateOrAddTransaction(transaction);
    }
    return transaction;
  }

  calculateBalance(blockchain) {
    let balance = this.balance;

    let transactions = [];

    // get transactions from chain
    for(let i = 1; i < blockchain.chain.length; i++){
      const block = blockchain.chain[i];
      // console.log(block);
      if(block.transactions){
        block.transactions.forEach((transaction)=>{
          // console.log(transaction);
          transactions.push(transaction);
        });
      }
    }

    // find all transactions matching address
    const walletInputTs = transactions.filter(
      (transaction) => transaction.input.address === this.address
    );

    let startTime = 0;

    // if any matching transactions, take only most recent input
    // -and set balance to that
    if (walletInputTs.length > 0) {
      const recentInputT = walletInputTs.reduce((prev, current) =>
        prev.input.dateCreated > current.input.dateCreated ? prev : current
      );

      balance = recentInputT.outputs.find(
        (output) => output.address === this.address
      ).amount;
      startTime = recentInputT.input.dateCreated;
    }

    // check time stamp, then add valid outputs to balance
    transactions.forEach((transaction) => {
      if (transaction.input.dateCreated > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.address) {
            balance += output.amount;
          }
        });
      }
    });
    console.log("balance " + balance);
    return balance;
  }

}

module.exports = Wallet;

// test

// let wallet = new Wallet();
// console.log(wallet.toString());


// let wallet2 = new Wallet();
// console.log(wallet2);



