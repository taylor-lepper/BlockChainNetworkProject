const WebSocket = require("ws");
const ChainUtil = require("../chain-util");

// fix for 64 bit integer sending info
BigInt.prototype.toJSON = function () {
  return this.toString();
};

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
  peer: "PEER",
  socket: "SOCKET",
  // pending: "PENDING"
  pending_difficulty: "PENDING_DIFFICULTY"
};

class Peers {
  constructor(blockchain, transactionPool, wallet, port) {
    this.id = ChainUtil.id();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.sockets = [];
    this.peers = peers;
    this.peersMAP = new Map();
    this.wallets = this.blockchain.wallets;
    this.wallet = wallet;
    this.port = port? port: process.env.P2P_PORT || 5001;
    this.cumulativeDifficulty = this.blockchain.cumulativeDifficulty;
    this.server = new WebSocket.Server({ port: this.port });
    this.url = `ws://localhost:${this.port}`;
  }

  toString() {
    return `Node -
        id          : ${this.id}
        peers       : ${this.peers}
        port        : ${this.port}`;
  }
  // called from api
  disconnect() {
    this.server.close();
  }


  // listen on p2p server for connections
  listen() {
    // event listener and callback function
    this.server.on("connection", (socket) => {
      console.log("listen");
      this.connectSocket(socket);
    });
    this.server.on("close", () => this.closeSocket());
    // to connect to the peers that we have specified
    this.connectToPeers();
    console.log(`Listening for peer to peer connection on port : ${this.port}`);
  }

  // after making a connection to a socket
  connectSocket(socket) {
    console.log("connectSocket");
    console.log("Socket connected");
    socket.id = ChainUtil.id();
    this.sockets.push(socket);
    // register a message event listener to the socket
    this.messageHandler(socket);

    // on new connection send the chain/wallets/peers to the peer
    this.sendChain(socket);
    this.syncWallets();
    this.syncPeer();
  }

  // after losing a connection to a socket
  closeSocket() {
    this.syncSockets(this.id, this.port);
  }

  connectToPeers() {
    // connect to each peer
    console.log("connectToPeers");
    peers.forEach((peer) => {
      var socket = new WebSocket(peer);

      socket.on("open", () => {
        this.connectSocket(socket);
      });
    });
  }

  messageHandler(socket) {
    console.log("messageHandler");
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
          break;
        case MESSAGE_TYPE.peer:
          // update peers
          const url = `ws://localhost:${data.port}`;
          if (!this.peers.includes(url)) {
            // console.log("no");
            this.peers.push(url);
          }
          this.peersMAP.set(data.id, url);
          break;
        case MESSAGE_TYPE.socket:
          // update peers about closed socket
          this.peersMAP.delete(data.id);
          const url2 = `ws://localhost:${data.port}`;
          if (this.peers.includes(url2)) {
            // console.log("YES");
            this.peers.splice(this.peers.indexOf(url2), 1);
          }
          this.sockets.pop();
        case MESSAGE_TYPE.pending_difficulty:
            // set difficulty for next block
            this.blockchain.setDifficulty(data.difficulty);
            break;
      }
    });
  }

    // brodcast pendingDifficulty to each peer
    broadcastDifficulty(difficulty) {
      this.sockets.forEach((socket) => {
        socket.send(
          JSON.stringify({
            type: MESSAGE_TYPE.pending_difficulty, difficulty
          })
        );
      });
    }

  // update peers socket disconnected
  syncSockets(id, port) {
    this.sockets.forEach((socket) => {
      this.sendSocket(socket, id, port);
    });
  }

  // send socket to close to all peers
  sendSocket(socket, id, port) {
    socket.send(JSON.stringify({ type: MESSAGE_TYPE.socket, id, port }));
  }

  // send peers to all peers
  sendPeer(socket, port, id) {
    socket.send(JSON.stringify({ type: MESSAGE_TYPE.peer, port, id }));
  }

  // sync peers with all peers
  syncPeer() {
    this.sockets.forEach((socket) => {
      this.sendPeer(socket, this.port, this.id);
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

    // send pending to all peers
    sendPending(socket, transactionPool) {
      socket.send(
        JSON.stringify({ type: MESSAGE_TYPE.pending, pending: transactionPool })
      );
    }
  
    // sync pending with all peers
    syncPending() {
      this.sockets.forEach((socket) => {
        this.sendPending(socket.socket, this.transactionPool);
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

  // info for api
  debug(wallets) {
    let walletsPretty = [];
    wallets.forEach((wallet) => {
      walletsPretty.push(ChainUtil.walletPretty(wallet));
    });

    const debugInfo = {
      about: "TaylorChain/1.0-JavaScript",
      url: `http://localhost:${P2P_PORT}`,
      chainId: this.blockchain.chain[0].blockHash,
      currentPeers: this.peers,
      wallets: walletsPretty,
      blockchain: this.blockchain.chain,
    };
    return debugInfo;
  }

  async info() {
    if(peers.length > 0){
      const info = {
        about: "TaylorChain/1.0-JavaScript",
        nodeID: this.id,
        nodeURL: this.url,
        chainId: this.blockchain.chain[0].blockHash,
        port: this.server.options.port,
        sockets: this.sockets.length,
        peers: this.peers.length,
        currentPeers: this.peers,
        currentDifficulty:
          this.blockchain.chain[this.blockchain.chain.length - 1].difficulty,
        cumulativeDifficulty: this.blockchain.calculateCumulativeDifficulty(),
        blocksCount: this.blockchain.chain.length,
        confirmedTransactions: this.blockchain.calculateConfirmedTransactions(),
        pendingTransactions: this.transactionPool.transactions.length,
      };
      return info;
    }
    return "There is currently no connected peers";
  }

  listAll() {
    return this.peersMAP;
  }

  listSockets() {
    let ids = [];
    this.sockets.forEach(socket =>{
      ids.push(socket.id);
    })
    return ids;
  }
}

module.exports = Peers;

// close connection
// socket.on("close", (code) => {
//   console.log("socket disconnect code", code);
//   console.log("Socket disconnected!");
// });
