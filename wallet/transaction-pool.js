const Transaction = require('./transaction');

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
      if(transaction.input.address === "faucet-wallet" || transaction.input.address === "blockchain-reward-wallet"){
        transaction.transferSuccessful = true;
        return transaction;
      }

      let inputAmount = BigInt(0);
      let outputTotal = BigInt(0);

      for(let i = 0; i < transaction.outputs.length; i++){
        let currOutput = transaction.outputs[i];
        // console.log(currOutput);
        if(currOutput.newSenderBalance){
          // console.log(currOutput);
          inputAmount = BigInt(currOutput.newSenderBalance);
        } else{
          // console.log(currOutput);
          outputTotal += BigInt(currOutput.sentAmount) + BigInt(currOutput.gas);
        }

      }

      // console.log(outputTotal);

      if (BigInt(transaction.input.senderBalance)  !== BigInt(inputAmount + outputTotal)) {
        console.log(BigInt(transaction.input.senderBalance));
        console.log(BigInt(inputAmount), BigInt(outputTotal));
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

  findTransactionPoolByAddress(addressToFind) {
    let matchingTransactions = [];
    for(let i = 0; i < this.transactions.length; i++){
      let currentTrans = this.transactions[i];
      if(currentTrans.outputs[0].address === addressToFind || currentTrans.outputs[1].address === addressToFind){
        matchingTransactions.push(currentTrans);
      }
    }
    return matchingTransactions.sort((a, b) => a.input.dateCreated > b.input.dateCreated ? 1 : -1);
  }
}

module.exports = TransactionPool;
