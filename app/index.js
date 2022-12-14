const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');
const P2pServer = require('./p2p-server');

// get port from user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// create server
const app = express();

// set up body parser
app.use(bodyParser.json());

// create a blockchain instance
const blockchain = new Blockchain();

// create p2p server instance and start it
const p2pserver = new P2pServer(blockchain);
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


// server config
app.listen(HTTP_PORT, ()=>{
    console.log(`listening on port ${HTTP_PORT}` );
});
