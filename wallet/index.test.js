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
      transactionPool
    );
  });

  beforeEach(() => {
    // this will create another output for the same transaction
    wallet.createTransaction(
      recipient,
      sendAmount,
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
    // filter will return only those items that satisfy the condition
    // hence an array of only the required outputs
    // map will do some processing over each individual item and replace it with something
    // else here the amount of the output
    expect(
      transaction.outputs
        .filter((output) => output.address === recipient)
        .map((output) => output.amount)
    ).toEqual([sendAmount, sendAmount]);
  });
});
