// packages
const express = require("express");
const bodyParser = require("body-parser");

// import files locally
const Blockchain = require("../blockchain");
const P2pServer = require("./p2p-server");
const Wallet = require("../wallet/index");
const TransactionPool = require("../wallet/transaction-pool");
const Miner = require("./miner");

// get port from user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// create server
const app = express();

// set up body parser
app.use(bodyParser.json());

// create a blockchain, wallet, and transactionPool instance
const blockchain = new Blockchain();
const wallet = new Wallet();

const transactionPool = new TransactionPool();

// create p2p server instance and start it
const p2pserver = new P2pServer(blockchain, transactionPool);
p2pserver.listen();

// create miner instance using all the above
const miner = new Miner(blockchain, transactionPool, wallet, p2pserver);

// ======== API ========

// blocks
app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

// mining
app.post("/mine", (req, res) => {
  const block = blockchain.addBlock(req.body.data);
//   console.log(`New block added: ${block.toString()}`);
  p2pserver.syncChain();
  res.redirect("/blocks");
});

app.post("/mine-transactions", (req, res) => {
  const block = miner.mine();
//   console.log(`New block added: ${block.toString()}`);
  res.redirect("/blocks");
});

// transactions
app.get("/transactions", (req, res) => {
  res.json(transactionPool.transactions);
});

app.post("/transact", (req, res) => {
  const { recipient, amount } = req.body;
  const transaction = wallet.createTransaction(
    recipient,
    amount,
    blockchain,
    transactionPool
  );
  p2pserver.broadcastTransaction(transaction);
  res.redirect("/transactions");
});

// public key
app.get("/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

// balance
app.get("/balance", (req, res) => {
  res.json({ balance: wallet.calculateBalance(blockchain) });
});

// server config
app.listen(HTTP_PORT, () => {
  console.log(`listening on port ${HTTP_PORT}`);
});
