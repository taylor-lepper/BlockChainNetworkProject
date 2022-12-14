const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = [];
  }

  isExistingTransaction(address) {
    return this.transactions.find(t => t.input.address === address);
  }

  updateOrAddTransaction(transaction) {
    // if transaction exists, save to variable
    // console.log("inside update or add transaction");
    let transactionWithId = this.transactions.find(
      (t => t.id === transaction.id));
    if (transactionWithId) {
      this.transactions[this.transactions.indexOf(transactionWithId)] =
        transaction;
        console.log("matching id in update or add");
    } else {
      this.transactions.push(transaction);
      // console.log("else condition update or add");
      // console.log(this.transactions);
    }
  }
}

module.exports = TransactionPool;

