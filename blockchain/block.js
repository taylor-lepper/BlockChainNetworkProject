const ChainUtil = require("../chain-util");
const { DIFFICULTY, MINE_RATE } = require("../config");



class Block {
  constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
    this.index = index;
    this.blockHash = blockHash;
    this.prevBlockHash = prevBlockHash;
    this.difficulty = difficulty || DIFFICULTY;
    this.minedBy = minedBy;
    this.blockDataHash = blockDataHash;
    this.nonce = nonce;
    this.dateCreated = dateCreated;
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

  static genesis(faucetTransaction) {
    return new this(0, [faucetTransaction], 0, "0x00", `GOD-MINER`, "blockDataHashBrowns", 0, "1991-10-01T00:00:00.000Z", "xxxxGENESISxxxxBLOCKxxxxGENESISxxxxBLOCKxxxxGENESISxxxxBLOCKxxxx");
  }

  static blockHash(index, transactions, difficulty, prevBlockHash, minedBy) {
    // const { index, transactions, difficulty,  prevBlockHash, minedBy } = block;
    return ChainUtil.hash(index, transactions, difficulty, prevBlockHash, minedBy).toString();
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
    // const nonce = lastBlock.nonce;
    let { difficulty } = lastBlock;
  
    let blockDataHash = Block.blockHash(index, transactions, difficulty, prevBlockHash, minedBy);
    
    // generate the hash of the block (MINING WORK)
    let _nonce = 0;
    do {

      _nonce++;
      dateCreated = new Date().toISOString();
      difficulty = Block.adjustDifficulty(lastBlock, dateCreated);
      hash = Block.hash(dateCreated, prevBlockHash, transactions, _nonce, difficulty);
      // check if we have the right # of zeros (P.O.W)
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));
    if(transactions){
      transactions.forEach(transaction=>{
        transaction.transferSuccessful = true;
      });
    }

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


