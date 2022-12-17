const { INITIAL_BALANCE } = require("../config");
const ChainUtil = require("../chain-util");
const Transaction = require("./transaction");

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

  createTransaction(recipient, amount, blockchain, transactionPool) {
    this.balance = this.calculateBalance(blockchain);

    if (amount > this.balance) {
      `Amount ${amount} exceeds the current balance: ${this.balance}`;
      return;
    }
    // console.log(transactionPool);
    let transaction = transactionPool.isExistingTransaction(this.publicKey);
    if (transaction) {
      // adds to existing outputs
      console.log("existing transaction to update");
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

  calculateBalance(blockchain) {
    let balance = this.balance;
    console.log("balance " + balance);
    let transactions = [];

    blockchain.chain.forEach((block) =>
      block.data.forEach((transaction) => {
        transactions.push(transaction);
      })
    );

    const walletInputTs = transactions.filter(
      (transaction) => transaction.input.address === this.publicKey
    );

    let startTime = 0;

    if (walletInputTs.length > 0) {
      const recentInputT = walletInputTs.reduce((prev, current) =>
        prev.input.timestamp > current.input.timestamp ? prev : current
      );

      balance = recentInputT.outputs.find(
        (output) => output.address === this.publicKey
      ).amount;
      startTime = recentInputT.input.timestamp;
    }

    transactions.forEach((transaction) => {
      if (transaction.input.timestamp > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.publicKey) {
            balance += output.amount;
          }
        });
      }
    });
    return balance;
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = "blockchain-reward-wallet";
    return blockchainWallet;
  }

  // updateBalance(blockchain) {
  //   let blocks = blockchain.chain;

  //   blocks.forEach((block) => {
  //     let data = block.data;
  //     if (data) {
  //       //  console.log(`data ${data}`);
  //       if (data.length < 2) {
  //         // ===== no transactions only a miner reward =====
  //         data.forEach((trans) => {
  //           // console.log(trans);
  //           let minerOutputs = trans.outputs[0];
  //           // console.log(`minerOutputs ${minerOutputs}`);
  //           let miningReward = minerOutputs.amount;
  //           let minerAddress = minerOutputs.address;
  //           // console.log(`miningReward ${miningReward}`);
  //           // console.log(`minerAddress ${minerAddress}`);

  //           // TODO: update mining wallet balance
  //           console.log(this);
  //           // let minerWallet = this.allWallets.find(
  //           //   (wallet) => wallet.publicKey === minerAddress
  //           // );

  //           // console.log("minerWallet " + minerWallet);
  //         });
  //       } else {
  //         // ===== there has been 1 or more transactions =====

  //         // ===== update the miners balance =====
  //         let minerTransaction = data[data.length - 1];
  //         // console.log(`minerTransaction ${minerTransaction}`);
  //         let { outputs } = minerTransaction;
  //         // console.log(`outputs ${outputs}`);

  //         outputs.forEach((output) => {
  //           // console.log(output);
  //           let miningReward = output.amount;
  //           let minerAddress = output.address;
  //           // console.log(`miningReward ${miningReward}`);
  //           // console.log(`minerAddress ${minerAddress}`);

  //           // TODO: update mining wallet balance

  //         });

  //         // ===== update each account balance in transactions =====

  //         for (let i = 0; i < data.length - 1; i++) {
  //           let currentTransaction = data[i];
  //           // console.log(currentTransaction);
  //           let outputs = currentTransaction.outputs;
  //           // console.log(outputs);

  //           // ----- get the sender info -----
  //           let senderObject = outputs[0];
  //           // console.log(senderObject);
  //           let senderAmount = senderObject.amount;
  //           let senderAddress = senderObject.address;
  //           // console.log(senderAddress, senderAmount);

  //           // TODO - update the sender info

  //           // ----- get the recipient info -----
  //           let recipientObject = outputs[1];
  //           // console.log(recipientObject);
  //           let recipientAmount = recipientObject.amount;
  //           let recipientAddress = recipientObject.address;
  //           // console.log(recipientAddress, recipientAmount);

  //           // TODO - update the recipient info
  //         }
  //       }
  //     }
  //   });
  // }
}

module.exports = Wallet;
