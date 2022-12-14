const { INITIAL_BALANCE } = require("../config");
const ChainUtil = require("../chain-util");
const Transaction = require("./transaction");
const TransactionPool = require("./transaction-pool");

class Wallet {
  constructor() {
    this.balance = INITIAL_BALANCE;
    this.keyPair = ChainUtil.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode("hex");
  }

  toString() {
    return `Wallet -
        publicKey   : ${this.publicKey.toString()}
        balance     : ${this.balance}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, transactionPool) {
    if (amount > this.balance) {
      `Amount ${amount} exceeds the current balance: ${this.balance}`;
      return;
    }
    // console.log(transactionPool);
    let transaction = transactionPool.isExistingTransaction(this.publicKey);
    if (transaction) {
      // adds to existing outputs
      console.log('existing transaction to update');
      transaction.update(this, recipient, amount);
    } else {
      // creates new transaction and updates the transaction pool
 
      transaction = Transaction.newTransaction(this, recipient, amount);
    //   console.log(transaction);
      transactionPool.updateOrAddTransaction(transaction);
    //   console.log("update or add transaction should be fired");
    }
    return transaction;
  }
}

module.exports = Wallet;
