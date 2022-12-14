// packages
const express = require('express');
const bodyParser = require('body-parser');

// import files locally
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');
const P2pServer = require('./p2p-server');
const Wallet = require("../wallet/index");
const TransactionPool = require("../wallet/transaction-pool");

// get port from user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// create server
const app = express();

// set up body parser
app.use(bodyParser.json());

// create a blockchain instance, wallet instance, and transactionPool instance
const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();

// create p2p server instance and start it
const p2pserver = new P2pServer(blockchain, transactionPool);
p2pserver.listen();

// ======== API ========


// api to get blocks
app.get('/blocks', (req,res)=>{
    res.json(blockchain.chain);
});

// api to add blocks
app.post('/mine', (req,res)=> {
    const block = blockchain.addBlock(req.body.data);
    console.log(`New block added: ${block.toString()}`);
    p2pserver.syncChain();
    res.redirect('/blocks');
});

// api to view transaction in the transaction pool
app.get('/transactions',(req,res)=>{
    res.json(transactionPool.transactions);
    });

// api to create transactions
app.post("/transact",(req,res)=>{
    const {recipient, amount} = req.body;
    const transaction = wallet.createTransaction(recipient, amount, transactionPool);
    p2pserver.broadcastTransaction(transaction);
    res.redirect("/transactions");
});

// server config
app.listen(HTTP_PORT, ()=>{
    console.log(`listening on port ${HTTP_PORT}` );
});
