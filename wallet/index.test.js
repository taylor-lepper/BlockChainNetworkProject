// to check if the createTransaction function works properly

const Wallet = require("./index");
const TransactionPool = require("./transaction-pool");
const Blockchain = require("../blockchain");
const { INITIAL_BALANCE } = require("../config");

describe("Wallet", () => {
  let wallet, blockchain, transactionPool, sendAmount, recipient, transaction;

  beforeEach(() => {
    wallet = new Wallet();
    transactionPool = new TransactionPool();
    blockchain = new Blockchain();

    sendAmount = 50;
    recipient = "r4nd-4ddr355";

    transaction = wallet.createTransaction(
      recipient,
      sendAmount,
      blockchain,
      transactionPool
    );
    wallet.createTransaction(
      recipient,
      sendAmount,
      blockchain,
      transactionPool
    );
  });

  // this will check if the output address back to the sender is reduced twice the sendAmount
  test("doubles the `sendAmount` subtracted from the wallet balance", () => {
    expect(
      transaction.outputs.find((output) => output.address === wallet.publicKey)
        .amount
    ).toEqual(wallet.balance - sendAmount * 2);
  });

  // checks if output was created again
  test("clones the `sendAmount`output for the transaction ", () => {
    expect(
      transaction.outputs
        .filter((output) => output.address === recipient)
        .map((output) => output.amount)
    ).toEqual([sendAmount, sendAmount]);
  });
});

describe("test calculating a balance", () => {
  let balanceToAdd,
    iterations,
    senderWallet,
    transactionPool,
    blockchain,
    wallet;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    blockchain = new Blockchain();
    senderWallet = new Wallet();
    wallet = new Wallet();
    balanceToAdd = 37;
    iterations = 1;
    for (let i = 0; i < iterations; i++) {
      senderWallet.createTransaction(
        wallet.publicKey,
        balanceToAdd,
        blockchain,
        transactionPool
      );
    }
    blockchain.addBlock(transactionPool.transactions);
  });

  test("calculates balances from blockchain for the recipients", () => {
    expect(wallet.calculateBalance(blockchain)).toEqual(
      INITIAL_BALANCE + balanceToAdd
    );
  });

  test("calculates the balance for the blockchain transaction matching senders", () => {
    expect(senderWallet.calculateBalance(blockchain)).toEqual(
      INITIAL_BALANCE - balanceToAdd
    );
  });

  describe("the recipient makes a transaction", () => {
    let balanceToSubtract, recipientBalance, amountToAdd;

    beforeEach(() => {
      transactionPool.clear();
      balanceToSubtract = 37;
      amountToAdd = 55;
      recipientBalance = wallet.calculateBalance(blockchain);

      wallet.createTransaction(
        senderWallet.publicKey,
        balanceToSubtract,
        blockchain,
        transactionPool
      );
      blockchain.addBlock(transactionPool.transactions);
    });

    test("calculates the recipient balance", () => {
      expect(wallet.calculateBalance(blockchain)).toEqual(
        recipientBalance - balanceToSubtract
      );
    });

    describe("sender sends another transaction to the recipient", () => {
      beforeEach(() => {
        console.log(recipientBalance);
        transactionPool.clear();
        senderWallet.createTransaction(
          wallet.publicKey,
          amountToAdd,
          blockchain,
          transactionPool
        );
        blockchain.addBlock(transactionPool.transactions);
      });
        test("calculates the recipient balance only using transaction since the most recent", () => {
          expect(wallet.calculateBalance(blockchain)).toEqual(
            recipientBalance - balanceToSubtract + amountToAdd
          );
        });
      
    });
  });
});
