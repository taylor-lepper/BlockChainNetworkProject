const Transaction = require("./transaction");
const Wallet = require("./index");
const ChainUtil = require("../chain-util");
const Blockchain = require('../blockchain/index');
const {MINING_REWARD} = require("../config");

describe("Transaction", () => {
  let transaction, wallet, recipient, amount;

  beforeEach(() => {
    wallet = new Wallet();
    blockchain = new Blockchain();
    amount = 50;
    recipient = "r3c1p13nt";
    transaction = Transaction.newTransaction(wallet, recipient, amount);
  });

  test("outputs the `amount` subtracted from the wallet balance", () => {
    expect(
      transaction.outputs.find((output) => output.address === wallet.publicKey)
        .amount
    ).toEqual(wallet.balance - amount);
  });

  test("outputs the `amount` added to the recipient", () => {
    expect(
      transaction.outputs.find((output) => output.address === recipient).amount
    ).toEqual(amount);
  });

  test("inputs the balance of the wallet", () => {
    expect(transaction.input.amount).toEqual(wallet.balance);
  });

  test("validates a valid transaction", () => {
    expect(Transaction.verifyTransaction(transaction)).toBe(true);
  });

  test("invalidates a invalid transaction", () => {
    transaction.outputs[0].amount = 500000;
    expect(Transaction.verifyTransaction(transaction)).toBe(false);
  });

  describe("transacting with less balance", () => {
    beforeEach(() => {
      amount = 50000000000;
      transaction = Transaction.newTransaction(wallet, recipient, amount);
    });

    test("does not create the transaction", () => {
      expect(transaction).toEqual(undefined);
    });
  });

  // test the transactions and updates
  describe("updated transaction", () => {
    let nextAmount, nextRecipient;

    beforeEach(() => {
      nextAmount = 20;
      nextRecipient = "n3xt-4ddr355";
      transaction = transaction.update(wallet, nextRecipient, nextAmount);
    });

    test("substracts the next amount from the sender's outouts", () => {
      expect(
        transaction.outputs.find(
          (output) => output.address === wallet.publicKey
        ).amount
      ).toEqual(wallet.balance - amount - nextAmount);
    });

    test("outputs an amount for the next recipient", () => {
      expect(
        transaction.outputs.find((output) => output.address === nextRecipient)
          .amount
      ).toEqual(nextAmount);
    });

    // test the miner class
    describe("creating a reward transaction", () => {
      beforeEach(() => {
        transaction = Transaction.rewardTransaction(
          wallet,
          Wallet.blockchainWallet()
        );
      });

      it("reward the miners wallet", () => {
        expect(
          transaction.outputs.find(
            (output) => output.address === wallet.publicKey
          ).amount
        ).toEqual(MINING_REWARD);
      });
    });
  });
});
