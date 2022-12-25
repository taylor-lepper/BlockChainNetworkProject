const ChainUtil = require("../chain-util");
const {
  MINING_REWARD,
  MINIMUM_TRANSACTION_FEE,
  FAUCET_REWARD,
} = require("../config");


class Transaction {
  constructor(blockchain) {
    this.input = null;
    this.blockToBeMinedIn = blockchain.chain.length;
    this.transferSuccessful = false;
    this.outputs = [];
  }

  static transactionWithOutputs(senderWallet, outputs, blockchain) {
    const transaction = new this(blockchain);
    // console.log("trans w/outputs", transaction);
    transaction.outputs.push(...outputs);
    Transaction.signTransaction(transaction, senderWallet);
    return transaction;
  }

  static newTransaction(senderWallet, recipient, amount, blockchain, gas) {
    console.log(JSON.stringify(senderWallet.balance));

    if (BigInt(amount > senderWallet.balance)) {
      console.log(
        `Amount : ${amount} exceeds the balance ${senderWallet.balance}`
      );
      return "Not enough balance to create transaction!";
    }

    // use helper function to create and sign transaction outputs
    return Transaction.transactionWithOutputs(
      senderWallet,
      [
        {
          newSenderBalance: BigInt(senderWallet.balance - amount - gas),
          address: senderWallet.address,
        },
        { sentAmount: BigInt(amount), gas: BigInt(gas), address: recipient },
      ],
      blockchain
    );
  }

  // update an existing transaction
  update(senderWallet, recipient, amount, gas) {
    const senderOutput = this.outputs.find(
      (output) => output.address === senderWallet.address
    );

    if (BigInt(amount > senderWallet.balance)) {
      console.log(`Amount ${amount} exceeds balance ${senderWallet.balance}`);
      return "Not enough balance to create transaction!";
    }

    senderOutput.newSenderBalance = BigInt(
      senderOutput.newSenderBalance - amount - gas
    );
    this.outputs.push({ sentAmount: BigInt(amount), gas: BigInt(gas), address: recipient });
    Transaction.signTransaction(this, senderWallet);
    console.log("updating and signing transaction");

    return this;
  }

  static signTransaction(transaction, senderWallet) {
    let hash = ChainUtil.hash(transaction);
    transaction.input = {
      transactionHash: hash,
      dateCreated: Date.now(),
      senderBalance: senderWallet.balance,
      address: senderWallet.address,
      senderPublicKey: senderWallet.publicKey,
      signature: senderWallet.sign(ChainUtil.hash(transaction.outputs)),
    };
  }

  static verifyTransaction(transaction) {
    return ChainUtil.verifySignature(
      transaction.input.senderPublicKey,
      transaction.input.signature,
      ChainUtil.hash(transaction.outputs)
    );
  }

  // mining reward
  static rewardTransaction(
    minerWallet,
    blockchainWallet,
    blockchain,
    transactionPool,
    gas
  ) {
    let transaction = blockchainWallet.createTransaction(
      blockchainWallet,
      minerWallet.address,
      BigInt(MINING_REWARD),
      blockchain,
      transactionPool,
      BigInt(gas)
    );
    return transaction;
  }

  // faucet reward
  static faucetTransaction(recipient, faucetWallet, blockchain, transactionPool, gas) {
    let transaction = faucetWallet.createTransaction(
      faucetWallet,
      recipient,
      BigInt(FAUCET_REWARD),
      blockchain,
      transactionPool,
      BigInt(gas)
    );
    return transaction;
  }
}

module.exports = Transaction;

// senderWallet, recipient, amount, blockchain, transactionPool, gas
