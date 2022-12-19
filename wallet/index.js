const { INITIAL_BALANCE } = require("../config");
const ChainUtil = require("../chain-util");
const Transaction = require("./transaction");


class Wallet {
  constructor() {
    this.balance = INITIAL_BALANCE;
    this.keyPair = ChainUtil.genKeyPair();
    this.privateKey = "0x" + this.keyPair.getPrivate("hex");
    this.publicKey = "0x" + this.keyPair.getPublic().encode("hex");
    this.address = "0x" + ChainUtil.computeAddressFromPrivKey(this.privateKey);
    this.publicKeyCompressed = ChainUtil.compressPublicKey(this.publicKey);


  }

  toString() {
    return `Wallet -
        balance     : ${this.balance}
        publicKey   : ${this.publicKeyCompressed.toString()}
        privateKey  : ${this.privateKey.toString()}
        address     : ${this.address.toString()}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(senderWallet, recipient, amount, blockchain, transactionPool, gas) {
    this.balance = this.calculateBalance(blockchain);

    if (amount > this.balance) {
      `Amount ${amount} exceeds the current balance: ${this.balance}`;
      return;
    }
    // console.log(transactionPool);
    let transaction = transactionPool.isExistingTransaction(this.address);
    if (transaction) {
      // adds to existing outputs
      console.log("existing transaction to update");
      transaction.update(this, recipient, amount);
    } else {
      // creates new transaction and updates the transaction pool

      transaction = Transaction.newTransaction(senderWallet, recipient, amount, blockchain, gas);
      //   console.log(transaction);
      transactionPool.updateOrAddTransaction(transaction);
      //   console.log("update or add transaction should be fired");
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
    // blockchain.chain.forEach((block) =>
    //   block.transactions.forEach((transaction) => {
    //     console.log(transaction);
    //     transactions.push(transaction);
    //   })
    // );

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

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = "blockchain-reward-wallet";
    blockchainWallet.balance = 1000000000000;
    return blockchainWallet;
  }

  static faucetWallet() {
    const faucetWallet = new this();
    faucetWallet.address = "faucet-wallet";
    faucetWallet.balance = 0;
    return faucetWallet;
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

// test

// let wallet = new Wallet();
// console.log(wallet.toString());


// let wallet2 = new Wallet();
// console.log(wallet2);



