// debug help
process.on("warning", (e) => console.warn(e.stack));

// packages
const express = require("express");
const bodyParser = require("body-parser");

// import files locally
const Blockchain = require("../blockchain");
const Peers = require("./peers");
const Wallet = require("../wallet/index");
const Transaction = require("../wallet/transaction");
const TransactionPool = require("../wallet/transaction-pool");
const Miner = require("./miner");
const ChainUtil = require("../chain-util");
const {} = require("../config");

// get port from user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";

// create server
const app = express();
app.use(bodyParser.json());

// create a blockchain, and transactionPool instance
var blockchain = new Blockchain();
const transactionPool = new TransactionPool(blockchain);
var wallet = new Wallet(BigInt(5555));

// create p2p server instance and start it
const peers = new Peers(blockchain, transactionPool, wallet);
peers.listen();
// console.log(peers.toString());

// add wallet to storage
wallet.pushIt(blockchain, peers);
blockchain.replaceWallets(blockchain.wallets);

// create miner instance using all the above
const miner = new Miner(
  blockchain,
  transactionPool,
  wallet,
  peers
);

// =======================================================================
// ======== API ========
// =======================================================================

// ======= get IP api ======
app.get("/ip", (req, res) => {
  let ipAddr = req.socket.remoteAddress;
  res.json({ ipAddr });
});

// ======= blocks/chain api =======
app.route('/blockchain')
  .get((req, res) =>  res.json(blockchain.chain))
  .post((req, res) =>  res.json(blockchain.chain));


app.get(`/blockchain/:index`, (req, res) => {
  res.json(blockchain.chain[req.params.index]);
});

app.post("/blockchain/reset", (req, res) => {
  transactionPool.clear();
  blockchain.chain = blockchain.chain[0];
  peers.syncChainNew(blockchain);
  blockchain.resetWallets(blockchain.wallets);
  peers.syncWalletsNew(blockchain.wallets);

  res.json("Resetting the blockchain to Phil Collin's greatest album...");
});

// ======= mining api =======
app.post("/mine", (req, res) => {
  const block = blockchain.addBlock(req.body.data);
  //   console.log(`New block added: ${block.toString()}`);
  peers.syncChain();
  res.redirect("/blockchain");
});

app.post("/mine-transactions", (req, res) => {
  const block = miner.mine();
  //   console.log(`New block added: ${block.toString()}`);
  // res.json(blockchain.chain);
  res.redirect("/blockchain");
});

// ======= transactions api =======
app.route('/transactions/pending')
  .get((req, res) =>   res.json(transactionPool.transactions))
  .post((req, res) =>   res.json(transactionPool.transactions));

app.get("/transactions/confirmed", (req, res) => {
  const confirmedFound = blockchain.findConfirmedTransactions();
  const confirmedTransactions = {
    info: "These transactions are from the blockchain",
    quantity: confirmedFound.length,
    confirmedTransactions: confirmedFound,
  };
  res.json(confirmedTransactions);
});

app.get("/transactions/hash/:hash", (req, res) => {
  const hashToFind = req.params.hash;
  // console.log(hashToFind);
  const hashFound = blockchain.findTransactionByHash(hashToFind);
  res.json(hashFound);
});

app.get("/transactions/address/:address", (req, res) => {
  const addressToFind = req.params.address;
  console.log(addressToFind);
  const transactionsFound = blockchain.findTransactionByAddress(addressToFind);
  const pendingFound =
    transactionPool.findTransactionPoolByAddress(addressToFind);
  res.json([
    {
      info: "These transactions are from the blockchain",
      quantity: transactionsFound.length,
      confirmedTransactions: transactionsFound,
    },
    {
      info: "These transactions have not been mined yet",
      quantity: pendingFound.length,
      pendingTransactions: pendingFound,
    },
  ]);
});

app.post("/transactions/create", (req, res) => {
  const { recipient, amount, gas } = req.body;
  // console.log(recipient, amount, gas);

  const transaction = wallet.createTransaction(
    wallet,
    recipient,
    BigInt(amount),
    blockchain,
    transactionPool,
    BigInt(gas)
  );
  // console.log("transaction", transaction);
  peers.broadcastTransaction(transaction);
  res.redirect("/transactions/pending");
});

// ======= wallet api =======
app.get("/wallet", (req, res) => {
  let matchingWallet = blockchain.wallets.filter(
    (walletInArr) => walletInArr.address === wallet.address
  );
  if (matchingWallet) {
    matchingWallet = matchingWallet[0];
    matchingWallet = ChainUtil.walletPretty(matchingWallet);
  } else {
    return res.json({ matchingWallet: "No wallet found" });
  }
  res.json({ matchingWallet: matchingWallet });
});

app.get("/wallet/all", (req, res) => {
  outPutWallets = [];
  blockchain.wallets.forEach((wallet) => {
    wallet = ChainUtil.walletPretty(wallet);
    outPutWallets.push(wallet);
  });
  res.json({ wallets: outPutWallets });
});

app.get("/wallet/all/balance", (req, res) => {
  outPutWallets = [];
  blockchain.wallets.forEach((wallet) => {
    wallet = ChainUtil.walletBalance(wallet);
    outPutWallets.push(wallet);
  });
  res.json({ wallets: outPutWallets });
});

app.get("/wallet/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

app.get("/wallet/address", (req, res) => {
  res.json({ address: wallet.address });
});

app.get("/wallet/balance", (req, res) => {
  res.json({ balance: wallet.calculateBalance(blockchain) });
});

app.post("/wallet/new", (req, res) => {
  const newWallet = new Wallet(0, req.body.name);
  newWallet.pushIt(blockchain, peers);
  res.json({ newWallet: ChainUtil.walletPretty(newWallet) });
});

// ======= faucet =======
app.post("/faucet", (req, res) => {
  let transaction = Transaction.faucetTransaction(
    wallet.address,
    blockchain.faucetWallet,
    blockchain,
    transactionPool,
    BigInt(0)
  );
  // transactionPool.transactions.push(transaction);
  peers.broadcastTransaction(transaction);
  res.json("Waiting for block to be mined...");
});

// ======= peers =======

app.get("/peers/info", (req, res) => {
  res.json(peers.info());
});

app.get("/peers/debug", (req, res) => {
  res.json(peers.debug(blockchain.wallets));
});

// ======= 404 ======

// =======================================================================
// ======== API END ========
// =======================================================================

// server config

var server = app.listen(HTTP_PORT, HOST, () => {
  var host = server.address().address;
  var port = server.address().port;
  // console.log(host, port);
  console.log(`Listening on http://${host}:${HTTP_PORT}`);
});



// test

// let bigNum = BigInt(5000000000000);
// let bigNum2 = BigInt(2222222);
// console.log((bigNum + bigNum2) + "");

// let date = new Date().toISOString();
// console.log(date);
