const { compressPublicKey } = require("../chain-util");
const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = [];
  }

  clear() {
    this.transactions = [];
  }

  isExistingTransaction(address) {
    return this.transactions.find((t) => t.input.address === address);
  }

  updateOrAddTransaction(transaction) {
    // if transaction exists, save to variable
    // console.log("inside update or add transaction");
    let existingTrans = this.transactions.find(
      (t) => t.input.transactionHash === transaction.input.transactionHash
    );
    if (existingTrans) {
      console.log("matching id in update or add");
      // console.log(transaction.transactionHash);
      this.transactions[this.transactions.indexOf(transactionWithId)] =
        transaction;
    } else {
      this.transactions.push(transaction);
      console.log("adding a new transaction to pool");
      // console.log(this.transactions);
    }
  }

  validTransactions() {
    // valid if total outputs equal inputs and signatures are the same
  
    return this.transactions.filter((transaction) => {
      if(transaction.input.address === "faucet-wallet"){
        transaction.transferSuccessful = true;
        return transaction;
      }

      let inputAmount = 0;
      let outputTotal = 0;

      for(let i = 0; i < transaction.outputs.length; i++){
        let currOutput = transaction.outputs[i];
        // console.log(currOutput);
        if(currOutput.newSenderBalance){
          // console.log(currOutput);
          inputAmount = currOutput.newSenderBalance;
        } else{
          // console.log(currOutput);
          outputTotal += (currOutput.sentAmount + currOutput.gas);
        }

      }

      // console.log(outputTotal);

      if (transaction.input.senderBalance  !== inputAmount + outputTotal) {
        console.log(`Invalid transaction (input/output) from ${transaction.input.address}`);
        return;
      }

      if (!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid transaction from ${transaction.input.address}`);
        return;
      }
      // console.log(transaction);
      transaction.transferSuccessful = true;
      return transaction;
    });
  }
}

module.exports = TransactionPool;
