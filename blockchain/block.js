const ChainUtil = require("../chain-util");
const { DIFFICULTY, MINE_RATE } = require("../config");

class Block {
  constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
    this.index = index;
    this.difficulty = difficulty || DIFFICULTY;
    this.prevBlockHash = prevBlockHash;
    this.minedBy = minedBy;
    this.blockDataHash = blockDataHash;
    this.nonce = nonce;
    this.dateCreated = dateCreated;
    this.blockHash = blockHash;
    this.transactions = transactions;
  }

  toString() {
    return `\nBlock -
        Index     : ${this.index}
        Timestamp : ${this.dateCreated}
        Hash      : ${this.blockHash}
        Last Hash : ${this.prevBlockHash}
        Nonce     : ${this.nonce}
        Difficulty: ${this.difficulty}
        Data      : ${this.transactions}`;
  }

  static genesis() {
    return new this(0, [], DIFFICULTY, "yesterdays-hashBrowns", `GOD-MINER`, "blockHashBrowns", 0, "Genesis-Chapter-1", "0006bae266e1018da7a9a85ad52eb77e705bcac91f511c4f76dc5ee39efc1b96");
  }

  static blockHash(index, transactions, difficulty, prevBlockHash, minedBy) {
    // const { index, transactions, difficulty,  prevBlockHash, minedBy } = block;
    return Block.hash(index, transactions, difficulty, prevBlockHash, minedBy);
  }

  static hash(dateCreated, prevBlockHash, transactions, nonce, difficulty) {
    return ChainUtil.hash(
      `${dateCreated}${prevBlockHash}${transactions}${nonce}${difficulty}`
    ).toString();
  }

  static mineBlock(lastBlock, transactions, minedBy) {
    let hash, dateCreated;
    const prevBlockHash = lastBlock.blockHash;
    const index = lastBlock.index + 1;
    const nonce = lastBlock.nonce;
    let { difficulty } = lastBlock;
  
    let blockDataHash = Block.blockHash(index, prevBlockHash, transactions, nonce)
    
    // generate the hash of the block (MINING WORK)
    let _nonce = 0;
    do {

      _nonce++;
      dateCreated = Date.now();
      difficulty = Block.adjustDifficulty(lastBlock, dateCreated);
      hash = Block.hash(dateCreated, prevBlockHash, transactions, _nonce, difficulty);
      // check if we have the right # of zeros (P.O.W)
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));
    transactions.forEach(transaction=>{
      transaction.transferSuccessful = true;
    });
    return new this(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, _nonce, dateCreated, hash);
  }

  static adjustDifficulty(lastBlock, currentTime) {
    let { difficulty } = lastBlock;
    difficulty =
      lastBlock.dateCreated + MINE_RATE > currentTime
        ? difficulty + 1
        : difficulty - 1;
    return difficulty;
  }
}

module.exports = Block;
