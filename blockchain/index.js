const Block = require("./block");
const Wallet = require("../wallet/index");
const { FAUCET_TRANSACTION } = require("../config");
const Transaction = require("../wallet/transaction");
const Peers = require("../app/peers");


class Blockchain {
  constructor() {
    this.faucetWallet = Wallet.faucetWallet();
    this.faucetWallet.balance = FAUCET_TRANSACTION.amount;
    this.chain = [Block.genesis(FAUCET_TRANSACTION)];
    this.blockchainWallet = Wallet.blockchainWallet();
    this.wallets = [this.blockchainWallet, this.faucetWallet];
  }

  
  updateWallets(newWallets) {
    // console.log("newWallets");
    // console.log(newWallets);
    // console.log("newWallets end");
    if(newWallets.length > 0){
      newWallets.forEach((wallet) => this.wallets.push(wallet));
    }
    const uniqueIds = [];

    const unique = this.wallets.filter((wallet) => {
      const isDuplicate = uniqueIds.includes(wallet.address);

      if (!isDuplicate) {
        uniqueIds.push(wallet.address);
        return true;
      }
      return false;
    });
    this.wallets = unique;
    // console.log(this.wallets);
  }

  replaceWallets(newWallets){
    console.log("Adding the current wallets with old ones");
    this.updateWallets(newWallets);
  }

  resetWallets(newWallets){
    this.wallets = [];
    console.log("Resetting the current wallets");
    newWallets.forEach(wallet =>{
      if(wallet.address === "blockchain-reward-wallet"){
        wallet.balance = 1000000000000; 
      } else if( wallet.address === "faucet-wallet"){
        wallet.balance = 9999999999999;
      } else{
        wallet.balance = 0;
      }
      this.wallets.push(wallet);
    });
    console.log("new ones", this.wallets);
  }


  addBlock(transactions, minedBy) {
    const block = Block.mineBlock(
      this.chain[this.chain.length - 1],
      transactions,
      minedBy
    );
    this.chain.push(block);
    console.log("chain " + this.chain + "\n");
    return block;
  }

  isValidChain(chain) {
    if (
      JSON.stringify(chain[0]) !==
      JSON.stringify(Block.genesis(FAUCET_TRANSACTION))
    ) {
      console.log("bad genesis");
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];
      const { dateCreated, prevBlockHash, transactions, nonce, difficulty } =
        block;
      if (
        block.prevBlockHash !== lastBlock.blockHash ||
        block.blockHash !==
          Block.hash(
            dateCreated,
            prevBlockHash,
            transactions,
            nonce,
            difficulty
          )
      ) {
        return false;
      }
    }
    return true;
  }

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log("Recieved chain is not longer than the current chain");
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log("Recieved chain is invalid");
      return;
    }

    console.log("Replacing the current chain with new chain");
    this.chain = newChain;
  }

  resetChain(chain) {
    this.chain = chain;
  }
}

module.exports = Blockchain;
