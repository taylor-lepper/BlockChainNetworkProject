const Wallet = require("../wallet/index");
const WebSocket = require("ws");
const ChainUtil = require("../chain-util");

BigInt.prototype.toJSON = function() { return this.toString() }

// peer to peer server port (user given or default)
const P2P_PORT = process.env.P2P_PORT || 5001;

// list of addresses to connect to
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

// message object
const MESSAGE_TYPE = {
  chain: "CHAIN",
  transaction: "TRANSACTION",
  clear_transactions: "CLEAR_TRANSACTIONS",
  wallets: "WALLETS",
  wallets_reset: "WALLETS_RESET",
  chain_reset: "CHAIN_RESET",
};

class Peers {
  constructor(blockchain, transactionPool, wallet) {
    this.id = ChainUtil.id();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.sockets = [];
    this.peers = peers;
    this.wallets = this.blockchain.wallets;
    this.wallet = wallet;
    this.server = new WebSocket.Server({ port: P2P_PORT });
  }


  toString() {
    return `Node -
        id          : ${this.id}
        peers       : ${this.peers}
        port        : ${this.server.options.port}`;
  }

  info() {
    const node = {
      id: this.id,
      peers: this.peers,
      port: this.server.options.port
    }

    
    return node;
  }

  // create the p2p server and its connections
  listen() {
    // console.log(this.server);

    // event listener and callback function
    // on any new connetion the current chain and wallets will be sent to the new connected peer
    this.server.on("connection", (socket) => this.connectSocket(socket));

    // to connect to the peers that we have specified
    this.connectToPeers();
    console.log(`Listening for peer to peer connection on port : ${P2P_PORT}`);
    console.log("peers", this.peers);
  }

  // after making a connection to a socket
  connectSocket(socket) {
    this.sockets.push(socket);
    console.log("Socket connected");
    // console.log("sockets", this.sockets);
    // register a message event listener to the socket
    this.messageHandler(socket);

    // on new connection send the chain/wallets to the peer
    this.sendChain(socket);
    this.syncWallets();
  }

  
  connectToPeers() {
    // connect to each peer
    peers.forEach((peer) => {
      // create a socket for each
      const socket = new WebSocket(peer);
      console.log("peer", peer);
      

      // event listener is emitted when connection successful
      // save the socket in the array
      socket.on("open", () => {
        this.connectSocket(socket);
      });
    });
  }

  messageHandler(socket) {
    // when message is recieved, execute the callback
    socket.on("message", (message) => {
      const data = JSON.parse(message);
      console.log("data ", data);

      switch (data.type) {
        case MESSAGE_TYPE.chain:
          // will replace chain if it is longer
          this.blockchain.replaceChain(data.chain);
          break;
        case MESSAGE_TYPE.transaction:
          // add transaction to the pool or replace existing one
          // console.log(data.transaction);
          this.transactionPool.updateOrAddTransaction(data.transaction);
          break;
        case MESSAGE_TYPE.clear_transactions:
          // clear transaction pool
          this.transactionPool.clear();
          break;
        case MESSAGE_TYPE.wallets:
          // sync wallets
          this.blockchain.replaceWallets(data.wallets);
          break;
        case MESSAGE_TYPE.wallets_reset:
          // reset wallets
          this.blockchain.resetWallets(data.wallets);
         
          break;
        case MESSAGE_TYPE.chain_reset:
          // reset chain
          this.blockchain.resetChain(data.chain);
      }
    });
  }

  // send chain to all peers
  sendChain(socket) {
    socket.send(
      JSON.stringify({ type: MESSAGE_TYPE.chain, chain: this.blockchain.chain })
    );
  }

  // sync chain with all peers
  syncChain() {
    this.sockets.forEach((socket) => {
      this.sendChain(socket);
    });
  }

  // send all wallets to peers
  sendWallet(socket) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.wallets,
        wallets: this.blockchain.wallets,
      })
    );
  }

  // sync all wallets with peers
  syncWallets() {
    this.sockets.forEach((socket) => {
      this.sendWallet(socket);
    });
  }

  // tell peers to clears transaction pool when new block mined
  broadcastClearTransactions() {
    this.sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPE.clear_transactions,
        })
      );
    });
  }

  // send transactions to peers
  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.transaction,
        transaction: transaction,
      })
    );
  }
  // brodcast transactions to each peer
  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      this.sendTransaction(socket, transaction);
    });
  }

  // tell sockets to reset wallets
  syncWalletsNew(wallets) {
    // console.log(wallets);
    this.sockets.forEach((socket) => {
      this.sendWalletsNew(socket, wallets);
    });
  }

  // send reset wallets to peers
  sendWalletsNew(socket, wallets) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.wallets_reset,
        wallets: wallets,
      })
    );
  }

  // tell sockets to reset blockchain
  syncChainNew(blockchain) {
    this.blockchain = blockchain;
    this.sockets.forEach((socket) => {
      this.sendChainNew(socket, this.blockchain);
    });
  }

  // send reset blockchain to peers
  sendChainNew(socket, blockchain) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.chain_reset,
        chain: blockchain.chain,
      })
    );
  }
}

module.exports = Peers;
