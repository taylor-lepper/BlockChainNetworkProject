const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = [];
  }

  clear() {
    this.transactions = [];
  }

  isExistingTransaction(address) {
    return this.transactions.find((t) => t.input.senderAddress === address);
  }

  updateOrAddTransaction(transaction) {
    let existingTrans = this.transactions.find(
      (t) => t.input.transactionHash === transaction.input.transactionHash
    );
    if (existingTrans) {
      console.log("matching hash, updating transaction");
      // console.log(transaction.transactionHash);
      this.transactions[this.transactions.indexOf(existingTrans)] = transaction;
    } else {
      this.transactions.push(transaction);
      console.log("adding a new transaction to pool");
      // console.log(this.transactions);
    }
  }

  validTransactions() {
    return this.transactions.filter((transaction) => {
      console.log(transaction);
      if (
        transaction.input.address === "faucet-wallet" ||
        transaction.input.address === "0x00000000000000000000000000000000000000"
      ) {
        return transaction;
      }

      let inputAmount = BigInt(0);
      let outputTotal = BigInt(0);

      for (let i = 0; i < transaction.outputs.length; i++) {
        let currOutput = transaction.outputs[i];
        // console.log(currOutput);
        if (currOutput.newSenderPendingBalance) {
          // console.log(currOutput);
          inputAmount = BigInt(currOutput.newSenderPendingBalance);
        } else {
          console.log(currOutput);
          outputTotal += BigInt(currOutput.sentAmount) + BigInt(currOutput.gas);
        }
      }

      // console.log(outputTotal);

      if (
        BigInt(transaction.input.senderConfirmedBalance) !==
        BigInt(inputAmount + outputTotal)
      ) {
        console.log(transaction.input.senderConfirmedBalance);
        console.log(inputAmount, outputTotal);
        console.log(
          `Invalid transaction (input/output) from ${transaction.input.address}`
        );
        return;
      }

      if (!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid transaction from ${transaction.input.address}`);
        return;
      }
      // console.log(transaction);
      return transaction;
    });
  }

  findTransactionPoolByAddress(addressToFind) {
    let matchingTransactions = [];
    for (let i = 0; i < this.transactions.length; i++) {
      let currentTrans = this.transactions[i];
      if (
        currentTrans.outputs[0].address === addressToFind ||
        currentTrans.outputs[1].address === addressToFind
      ) {
        matchingTransactions.push(currentTrans);
      }
    }
    return matchingTransactions.sort((a, b) =>
      a.input.dateCreated > b.input.dateCreated ? 1 : -1
    );
  }
}

module.exports = TransactionPool;
