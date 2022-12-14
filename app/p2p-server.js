const WebSocket = require('ws');

// peer to peer server port (user given or default)
const P2P_PORT = process.env.P2P_PORT || 5001;

// list of addresses to connect to
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];


class P2pServer{
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    // create the p2p server and its connections

    listen(){
        const server = new WebSocket.Server({port: P2P_PORT});

        // event listener and callback function 
        // on any new connetion  the current chain will be sent to the new connected peer
        server.on('connection', socket => this.connectSocket(socket));

        // to connect to the peers that we have specified
        this.connectToPeers();

        console.log(`Listening for peer to peer connection on port : ${P2P_PORT}`);
        console.log(peers);
    }

    // after making a connection to a socket
    connectSocket(socket){
        this.sockets.push(socket);
        console.log("Socket connected");

        // register a message event listener to the socket
        this.messageHandler(socket);

        // on new connection send the chain to the peer
        this.sendChain(socket);
    }

    connectToPeers(){
        // connect to each peer
        peers.forEach(peer => {
            // create a socket for each
            const socket = new WebSocket(peer);

            // event listener is emitted when connection successfull
            // save the socket in the array
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    messageHandler(socket){
        // when message is recieved, execute the callback
        socket.on('message', message => {
            const data = JSON.parse(message);
            console.log("data ", data);
            this.blockchain.replaceChain(data);
        });
    }

    sendChain(socket){
       socket.send(JSON.stringify(this.blockchain.chain));
    }

    syncChain(){
        this.sockets.forEach(socket =>{
            this.sendChain(socket);
        });
    }
}

module.exports = P2pServer;