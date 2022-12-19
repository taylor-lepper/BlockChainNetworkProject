const ChainUtil = require("../chain-util");
const { MINING_REWARD, MINIMUM_TRANSACTION_FEE } = require("../config");

class Transaction {
  constructor(blockchain, gas) {
    this.input = null;
    this.blockToBeMinedIn = blockchain.chain.length;
    this.gas = gas || MINIMUM_TRANSACTION_FEE;
    this.transferSuccessful = false;
    this.outputs = [];
  }

  static transactionWithOutputs(senderWallet, outputs, blockchain, gas) {
    const transaction = new this(blockchain, gas);
    transaction.outputs.push(...outputs);
    Transaction.signTransaction(transaction, senderWallet);
    return transaction;
  }

  static newTransaction(senderWallet, recipient, amount, blockchain) {
    if (amount > senderWallet.balance) {
      console.log(
        `Amount : ${amount} exceeds the balance ${senderWallet.balance}`
      );
      return;
    }

    // use helper function to create and sign transaction outputs
    return Transaction.transactionWithOutputs(senderWallet, [
      {
        amount: senderWallet.balance - amount,
        address: senderWallet.address,
      },
      { amount: amount, address: recipient },
    ], blockchain);
  }

  static signTransaction(transaction, senderWallet) {
    let hash = ChainUtil.hash(transaction);
    transaction.input = {
      transactionHash: hash,
      dateCreated: Date.now(),
      amount: senderWallet.balance,
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

  static rewardTransaction(minerWallet, blockchainWallet, blockchain) {

    blockchainWallet.balance -= MINING_REWARD;
    return Transaction.transactionWithOutputs(blockchainWallet, [
      {
        amount: MINING_REWARD,
        address: minerWallet.address,
      },
    ], blockchain);
  }



  update(senderWallet, recipient, amount) {
    const senderOutput = this.outputs.find(
      (output) => output.address === senderWallet.address
    );

    if (amount > senderWallet.amount) {
      console.log(`Amount ${amount} exceeds balance`);
      return;
    }

    senderOutput.amount = senderOutput.amount - amount;
    this.outputs.push({ amount: amount, address: recipient });
    Transaction.signTransaction(this, senderWallet);

    return this;
  }
}

module.exports = Transaction;


