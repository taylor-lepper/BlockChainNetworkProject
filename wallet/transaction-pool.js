const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = [];
  }

  clear(){
    this.transactions = [];
  }

  isExistingTransaction(address) {
    return this.transactions.find((t) => t.input.address === address);
  }

  updateOrAddTransaction(transaction) {
    // if transaction exists, save to variable
    // console.log("inside update or add transaction");
    let transactionWithId = this.transactions.find(
      (t) => t.id === transaction.id
    );
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

  validTransactions() {
    // valid if total outputs equal inputs and signatures are the same

    return this.transactions.filter((transaction) => {
      // reduce adds up all the items and saves in variable passed as 1st param
      // 2nd param is the intitial value of the sum

      const outputTotal = transaction.outputs.reduce((total, output) => {
        return total + output.amount;
      }, 0);

      if (transaction.input.amount !== outputTotal){
        console.log(`Invalid transaction from ${transaction.input.address}`);
        return;
      }

      if(!Transaction.verifyTransaction(transaction)){
        console.log(`Invalid transaction from ${transaction.input.address}`);
        return;
      }
      console.log(transaction);
      transaction.transferSuccessful = true;
      return transaction;
    });
  }
}

module.exports = TransactionPool;
