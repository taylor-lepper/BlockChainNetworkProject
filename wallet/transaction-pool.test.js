const TransactionPool = require("./transaction-pool");
const Transaction = require("./transaction");
const Wallet = require("./index");
const Blockchain = require("../blockchain");

describe("Transaction Pool", () => {
  let transactionPool, wallet, blockchain, transaction, newTransaction;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    wallet = new Wallet();
    blockchain = new Blockchain();
    transaction = wallet.createTransaction("address", 30, blockchain, transactionPool);
  });

  test("adds a transaction to the pool", () => {
    // console.log(transactionPool.transactions);
    expect(
      transactionPool.transactions.find((t) => t.id === transaction.id)
    ).toEqual(transaction);
  });

  test("updates a transaction in the pool", () => {
    const oldTransaction = JSON.stringify(transaction);
    newTransaction = transaction.update(wallet, "address", blockchain, 40);
    transactionPool.updateOrAddTransaction(newTransaction);
    expect(
      JSON.stringify(
        transactionPool.transactions.find((t) => t.id === transaction.id)
      )
    ).not.toEqual(oldTransaction);
  });

  // test clear transactions pool and valid transaction
  test("clears transactions", () => {
    transactionPool.clear();
    expect(transactionPool.transactions).toEqual([]);
  });

  describe("mixing valid and corrupt transactions", () => {
    let validTransactions;

    beforeEach(() => {
      validTransactions = [...transactionPool.transactions];

      // creating new transactions with corrupted transactions
      for (let i = 0; i < 6; i++) {
        wallet = new Wallet();
        transaction = wallet.createTransaction(
          "r4nd-4ddr355",
          30,
          blockchain,
          transactionPool
        );
        if (i & 1) {
          transaction.input.amount = 999999;
        } else {
          validTransactions.push(transaction);
        }
      }
    });

    test("shows a difference between valid and corrupt transactions", () => {
      expect(JSON.stringify(transactionPool.transactions)).not.toEqual(
        JSON.stringify(validTransactions)
      );
    });

    test("grabs valid transactions", () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });
  });

});
