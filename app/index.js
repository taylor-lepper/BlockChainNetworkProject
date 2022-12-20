// packages
const express = require("express");
const bodyParser = require("body-parser");

// import files locally
const Blockchain = require("../blockchain");
const Peers = require("./peers");
const Wallet = require("../wallet/index");
const TransactionPool = require("../wallet/transaction-pool");
const Miner = require("./miner");
const ChainUtil = require("../chain-util");

let wallets = [];

// get port from user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// create server
const app = express();

// set up body parser
app.use(bodyParser.json());

// create a blockchain, wallet, and transactionPool instance
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const faucetWallet = blockchain.faucetWallet;
const wallet = new Wallet(0);
const blockchainWallet = Wallet.blockchainWallet();
wallets.push(blockchainWallet, faucetWallet, wallet);
blockchain.replaceWallets(wallets);




// create p2p server instance and start it
const peers = new Peers(blockchain, transactionPool, wallets);
peers.listen();

// create miner instance using all the above
const miner = new Miner(blockchain, transactionPool, wallet, peers, blockchainWallet);

// ======== API ========

// === blocks ===
app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.get(`/blocks/:index`, (req, res) => {
  let index = req.params.index;
  res.json(blockchain.chain[index]);
});


// === mining ===
app.post("/mine", (req, res) => {
  const block = blockchain.addBlock(req.body.data);
  //   console.log(`New block added: ${block.toString()}`);
  peers.syncChain();
  res.redirect("/blocks");
});

app.post("/mine-transactions", (req, res) => {
  const block = miner.mine();
  //   console.log(`New block added: ${block.toString()}`);
  res.redirect("/blocks");
});

// === transactions ===
app.get("/transactions", (req, res) => {
  res.json(transactionPool.transactions);
});

app.post("/transact", (req, res) => {
  const { recipient, amount, gas } = req.body;
  const transaction = wallet.createTransaction(
    wallet,
    recipient,
    amount,
    blockchain,
    transactionPool,
    gas
  );
  peers.broadcastTransaction(transaction);
  res.redirect("/transactions");
});

// === wallet api ===
app.get("/wallet", (req, res) => {
  let matchingWallet = wallets.filter(
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
  blockchain.wallets.forEach(wallet=>{
    wallet = ChainUtil.walletPretty(wallet);
    outPutWallets.push(wallet);
  });
  res.json({ wallets: outPutWallets });
});

app.get("/wallet/all/balance", (req, res) => {
  outPutWallets = [];
  blockchain.wallets.forEach(wallet=>{
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
  const newWallet = wallet.createNewWallet(0);
  wallets.push(newWallet);
  blockchain.wallets.push(newWallet);
  // console.log(newWallet);
 
  peers.syncWallets();
  res.json({newWallet: ChainUtil.walletPretty(newWallet)});
});

// === faucet ===
app.post("/faucet", (req, res) => {
  const recipient = wallet.address;
  const amount = 5000;
  const transaction = wallet.createTransaction(
    blockchain.faucetWallet,
    recipient,
    amount,
    blockchain,
    transactionPool,
    0
  );
  peers.broadcastTransaction(transaction);
  res.json("Waiting for block to be mined...");
});

// server config
app.listen(HTTP_PORT, () => {
  console.log(`listening on port ${HTTP_PORT}`);
});
