const Block = require("./block");
const Wallet = require("../wallet/index");
const {FAUCET_TRANSACTION} = require("../config");
const Transaction = require("../wallet/transaction");


class Blockchain {
  constructor() {
    this.faucetWallet = Wallet.faucetWallet();
    this.faucetWallet.balance = FAUCET_TRANSACTION.amount;
    this.chain = [Block.genesis(FAUCET_TRANSACTION)];
  }

  addBlock(transactions, minedBy) {
    const block = Block.mineBlock(this.chain[this.chain.length - 1], transactions, minedBy);
    this.chain.push(block);
    console.log("chain " + this.chain + "\n");
    return block;
  }

  isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis(FAUCET_TRANSACTION))){
      console.log("bad genesis")
      return false;
    }
      

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];
      const { dateCreated, prevBlockHash, transactions, nonce, difficulty } = block;
      if (
        block.prevBlockHash !== lastBlock.blockHash ||
        block.blockHash !== Block.hash(dateCreated, prevBlockHash, transactions, nonce, difficulty)){
          return false;
        }
    }
    return true;
  }

replaceChain(newChain){
    if(newChain.length <= this.chain.length){
        console.log("Recieved chain is not longer than the current chain");
        return;
    } else if(!this.isValidChain(newChain)){
        console.log("Recieved chain is invalid");
        return;
    }

    console.log("Replacing the current chain with new chain");
    this.chain = newChain;
}

}

module.exports = Blockchain;
