const { INITIAL_BALANCE, MINIMUM_TRANSACTION_FEE } = require("../config");
const ChainUtil = require("../chain-util");
const Transaction = require("./transaction");

class Wallet {
  constructor(balance, name) {
    this.name = name || ChainUtil.randomNameGenerator();
    this.safeBalance = balance;
    this.confirmedBalance = balance;
    this.pendingBalance = balance;
    this.keyPair = ChainUtil.genKeyPair();
    this.privateKey = "0x" + this.keyPair.getPrivate("hex");
    this.publicKey = "0x" + this.keyPair.getPublic().encode("hex");
    this.address = "0x" + ChainUtil.computeAddressFromPrivKey(this.privateKey);
    this.publicKeyCompressed = ChainUtil.compressPublicKey(this.publicKey);
  }

  toString() {
    return `Wallet -
        name        : ${this.name}
        safeBalance : ${this.safeBalance}
        publicKey   : ${this.publicKeyCompressed.toString()}
        privateKey  : ${this.privateKey.toString()}
        address     : ${this.address.toString()}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }


  pushIt(blockchain, peers) {
    blockchain.wallets.push(this);
    peers.syncWallets();
  }

  static blockchainWallet() {
    let zero = "0";
    const blockchainWallet = new this(
      BigInt(1000000000000),
      "Mining Rewards Wallet from Genesis"
    );
    blockchainWallet.address = "0x" + zero.repeat(38);
    blockchainWallet.publicKey = "0x" + zero.repeat(130);
    blockchainWallet.publicKeyCompressed = "0x" + zero.repeat(66);
    blockchainWallet.privateKey = "0x" + zero.repeat(64);
    return blockchainWallet;
  }

  static faucetWallet() {
    const faucetWallet = new this(BigInt(99999999999), "Faucet Wallet ");
    faucetWallet.address = "faucet-wallet";
    return faucetWallet;
  }

  createTransaction(
    senderWallet,
    recipient,
    amount,
    blockchain,
    transactionPool,
    gas
  ) {
  
    // this.balance = this.calculateBalance(blockchain);
    if (BigInt(senderWallet.confirmedBalance) < BigInt(amount) + BigInt(gas)) {
      console.log(
        `Amount ${amount} exceeds the current balance: ${senderWallet.confirmedBalance}`
      );
      return `Amount ${amount} exceeds the current balance: ${senderWallet.confirmedBalance}`;
    }
    // console.log(transactionPool);
    let transaction = transactionPool.isExistingTransaction(this.address);
    if (transaction) {
      // adds to existing outputs
      console.log("existing transaction to update");
      transaction.update(this, recipient, amount, blockchain, gas);
    } else {
      // creates new transaction and updates the transaction pool

      transaction = Transaction.newTransaction(
        senderWallet,
        recipient,
        amount,
        blockchain,
        gas
      );
      //   console.log(transaction);
      transactionPool.updateOrAddTransaction(transaction);
    }
    return transaction;
  }

  calculateBalance(blockchain, transactionPool) {
    let safeBalance, confirmedBalance, pendingBalance;
    const currBlock = blockchain.chain.length - 1;
    // console.log("currBlock ", currBlock);

    let safeTransactions = [];
    let confirmedTransactions = [];
    let pendingTransactions = transactionPool.transactions;


    // get transactions from chain
    for (let i = 1; i < blockchain.chain.length; i++) {
      const block = blockchain.chain[i];
      // console.log(block);
        block.transactions.forEach((transaction) => {
          let currIndex = transaction.minedInBlockIndex;
          // console.log("currIndex ", currIndex);
          currBlock - currIndex >= 6
            ? safeTransactions.push(transaction)
            : confirmedTransactions.push(transaction);
        });
    }

     safeBalance = this.calculateSafeBalance(safeTransactions);
     confirmedBalance = this.calculateConfirmedBalance(
      confirmedTransactions
    );
    if(pendingTransactions.length === 0){
      pendingBalance = confirmedBalance;
      this.pendingBalance = BigInt(confirmedBalance); 
    } else{
      pendingBalance = this.calculatePendingBalance(pendingTransactions);
      this.pendingBalance = BigInt(pendingBalance);
    }


    // console.log("safeTransactions", safeTransactions);
    // console.log("confirmedTransactions", confirmedTransactions);
    // console.log("pendingTransactions", pendingTransactions);
    this.safeBalance = BigInt(safeBalance);
    this.confirmedBalance = BigInt(confirmedBalance);

    
    return { safeBalance, confirmedBalance, pendingBalance };
  }

  calculateSafeBalance(safeTransactions) {
    let safeBalance = this.safeBalance;
    console.log("safeBalance beginning ", safeBalance);

    // find all transactions matching address
    const safeWalletInputTs = safeTransactions.filter(
      (transaction) => transaction.input.senderAddress === this.address
    );
    // console.log(safeWalletInputTs);
    let startTime = "1991-10-01T00:00:00.000Z";

    // if any matching transactions, take only most recent input
    // and set balance to that
    if (safeWalletInputTs.length > 0) {
      // console.log("found input");
      const safeRecentInputT = safeWalletInputTs.reduce((prev, current) =>
        prev.input.dateCreated > current.input.dateCreated ? prev : current
      );

      safeBalance = safeRecentInputT.outputs.find(
        (output) => output.address === this.address
      ).newSenderSafeBalance;
      startTime = safeRecentInputT.input.dateCreated;
    }

    // check time stamp, then add valid outputs to balance
    safeTransactions.forEach((transaction) => {
      if (transaction.input.dateCreated > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.address) {
            safeBalance += output.sentAmount;
          }
        });
      }
    });
    console.log("final safeBalance returned ", safeBalance);
    return safeBalance;
  }

  calculateConfirmedBalance(confirmedTransactions) {
    let confirmedBalance = this.confirmedBalance;
    console.log("confirmedBalance beginning ", confirmedBalance);

    // find all transactions matching address
    const confirmedWalletInputTs = confirmedTransactions.filter(
      (transaction) => transaction.input.senderAddress === this.address
    );
    // console.log(safeWalletInputTs);
    let startTime = "1991-10-01T00:00:00.000Z";

    // if any matching transactions, take only most recent input
    // and set balance to that
    if (confirmedWalletInputTs.length > 0) {
      console.log("found input");
      const confirmedRecentInputT = confirmedWalletInputTs.reduce(
        (prev, current) =>
          prev.input.dateCreated > current.input.dateCreated ? prev : current
      );

      confirmedBalance = confirmedRecentInputT.outputs.find(
        (output) => output.address === this.address
      ).newSenderConfirmedBalance;
      startTime = confirmedRecentInputT.input.dateCreated;
    }

    // check time stamp, then add valid outputs to balance
    confirmedTransactions.forEach((transaction) => {
      if (transaction.input.dateCreated > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.address) {
            console.log("found output");
            confirmedBalance += BigInt(output.sentAmount);
          }
        });
      }
    });
    console.log("final confirmedBalance returned ", confirmedBalance);
    return confirmedBalance;
  }

  calculatePendingBalance(pendingTransactions) {
    let pendingBalance = this.pendingBalance;
    console.log("pendingBalance beginning ", pendingBalance);

    // find all transactions matching address
    const pendingWalletInputTs = pendingTransactions.filter(
      (transaction) => transaction.input.senderAddress === this.address
    );
    // console.log(safeWalletInputTs);
    let startTime = "1991-10-01T00:00:00.000Z";

    // if any matching transactions, take only most recent input
    // and set balance to that
    if (pendingWalletInputTs.length > 0) {
      // console.log("found input");
      const pendingRecentInputT = pendingWalletInputTs.reduce((prev, current) =>
        prev.input.dateCreated > current.input.dateCreated ? prev : current
      );

      pendingBalance = pendingRecentInputT.outputs.find(
        (output) => output.address === this.address
      ).newSenderPendingBalance;
      startTime = pendingRecentInputT.input.dateCreated;
    }

    // check time stamp, then add valid outputs to balance
    pendingTransactions.forEach((transaction) => {
      if (transaction.input.dateCreated > startTime) {
        transaction.outputs.find((output) => {
          if (output.address === this.address) {
            pendingBalance += output.sentAmount;
          }
        });
      }
    });
    console.log("final pendingBalance returned ", pendingBalance);
    return pendingBalance;
  }
}

module.exports = Wallet;

// test

// let wallet = new Wallet();
// console.log(wallet.toString());

// let wallet2 = new Wallet();
// console.log(wallet2);
