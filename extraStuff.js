app.get("/peers/debug", (req, res) => {
    res.json(peers.debug(blockchain.wallets));
  });

debug(wallets) {
    let walletsPretty = [];
    wallets.forEach((wallet) => {
      walletsPretty.push(ChainUtil.walletPretty(wallet));
    });

    const info = {
      about: "TaylorChain/1.0-JavaScript",
      url: `http://localhost:${P2P_PORT}`,
      chainId: this.blockchain.chain[0].blockHash,
      currentPeers: this.peers,
      wallets: walletsPretty,
      blockchain: this.blockchain.chain,
    };
    return info;
  }

  info() {
    const node = {
      about: "TaylorChain/1.0-JavaScript",
      nodeID: this.id,
      nodeURL: this.url,
      chainId: this.blockchain.chain[0].blockHash,
      port: this.server.options.port,
      peers: this.peers.length,
      currentPeers: this.peers,
      currentDifficulty:
        this.blockchain.chain[this.blockchain.chain.length - 1].difficulty,
      cumulativeDifficulty: this.blockchain.calculateCumulativeDifficulty(),
      blocksCount: this.blockchain.chain.length,
      confirmedTransactions: this.blockchain.calculateConfirmedTransactions(),
      pendingTransactions: this.transactionPool.transactions.length,
    };
    return node;
  }


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

  findTransactionByHash(hashToFind) {
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        // console.log(transaction);
        if (transaction.input.transactionHash === hashToFind) {
          console.log("matching hash");
          return transaction;
        }
      }
    }
    return `No matching transaction found for hash '${hashToFind}'`;
  }

  findTransactionByAddress(addressToFind) {
    let matchingTransactions = [];
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        // console.log(transaction);
        if (
          transaction.outputs[0].address === addressToFind ||
          transaction.outputs[1].address === addressToFind
        ) {
          // console.log("matching address");
          matchingTransactions.push(transaction);
        }
      }
    }
    return matchingTransactions.sort((a, b) => (a.input.dateCreated > b.input.dateCreated) ? 1 : -1);
  }

findConfirmedTransactions(){
  let transactionsList = [];
    for (let i = 1; i < this.chain.length; i++) {
      let currTransactions = this.chain[i].transactions;
      // console.log(currTransactions);
      for (let i = 0; i < currTransactions.length; i++) {
        let transaction = currTransactions[i];
        console.log(transaction);
       
      }
    }
    return transactionsList.sort((a, b) => (a.input.dateCreated > b.input.dateCreated) ? 1 : -1);
}


app.get("/transactions/pending", (req, res) => {
    res.json(transactionPool.transactions);
  });
  
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

  // ======= get IP api ======
app.get("/ip", (req, res) => {
    let ipAddr = req.socket.remoteAddress;
    res.json({ ipAddr });
  });


  findTransactionPoolByAddress(addressToFind) {
    let matchingTransactions = [];
    for(let i = 0; i < this.transactions.length; i++){
      let currentTrans = this.transactions[i];
      if(currentTrans.outputs[0].address === addressToFind || currentTrans.outputs[1].address === addressToFind){
        matchingTransactions.push(currentTrans);
      }
    }
    return matchingTransactions.sort((a, b) => a.input.dateCreated > b.input.dateCreated ? 1 : -1);
  }