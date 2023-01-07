const ChainUtil = require("../chain-util");
const { DIFFICULTY, MINE_RATE, MINING_REWARD } = require("../config");

class Block {
  constructor(
    index,
    transactions,
    difficulty,
    prevBlockHash,
    minedBy,
    blockDataHash,
    nonce,
    dateCreated,
    blockHash
  ) {
    this.index = index >>> 0;
    this.blockHash = blockHash;
    this.prevBlockHash = prevBlockHash;
    this.difficulty = difficulty || DIFFICULTY;
    this.minedBy = minedBy;
    this.blockDataHash = blockDataHash;
    this.nonce = nonce >>> 0;
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
    return new this(
      0,
      [faucetTransaction],
      0,
      "0x00",
      `GOD-MINER`,
      "blockDataHashBrowns",
      0,
      "1991-10-01T00:00:00.000Z",
      "xxxxGENESISxxxxBLOCKxxxxGENESISxxxxBLOCKxxxxGENESISxxxxBLOCKxxxx"
    );
  }

  static blockHash(index, transactions, difficulty, prevBlockHash, minedBy) {
    // const { index, transactions, difficulty,  prevBlockHash, minedBy } = block;
    return ChainUtil.hash(
      index,
      transactions,
      difficulty,
      prevBlockHash,
      minedBy
    ).toString();
  }

  static hash(dateCreated, prevBlockHash, transactions, nonce, difficulty) {
    return ChainUtil.hash(
      `${dateCreated}${prevBlockHash}${transactions}${nonce}${difficulty}`
    ).toString();
  }

  static prepareBlockCandidate(lastBlock, transactionPool, minedBy, blockchain, peers) {
    let rewards = BigInt(0);
    const prevBlockHash = lastBlock.blockHash;
    const index = lastBlock.index + 1;
    let dateCreated = new Date().toISOString();
    let difficulty;

    // adjust difficulty
    // console.log(blockchain.pendingDifficulty);
    if(blockchain.pendingDifficulty.length === 0 ){
      difficulty = Block.adjustDifficulty(lastBlock, dateCreated);
      // keep difficulty at 1 if it drops to 0
      if(difficulty === 0) difficulty = 1;
      blockchain.setDifficulty(difficulty);
      peers.broadcastDifficulty(difficulty);
      console.log("difficulty ", difficulty);
    } else{
      difficulty = blockchain.pendingDifficulty[0];
    }
   
    console.log(difficulty);

    // hash
    let blockDataHash = Block.blockHash(
      JSON.stringify({
        index: index,
        transactions: transactionPool.transactions,
        difficulty: difficulty,
        prevBlockHash: prevBlockHash,
        minedBy: minedBy,
        timeStamp: dateCreated,
      })
    );

    // console.log(transactionPool.transactions);
    const validTransactions = transactionPool.validTransactions();
    if (validTransactions) {
      // console.log(validTransactions);

      validTransactions.forEach((transaction) => {
        // tally rewards for miner from each trans
        transaction.outputs.forEach((output) => {
          if (output.gas) {
            rewards += output.gas;
          }
        });
      });
    }

    let prospectiveBlock = {
      index: index,
      timeStamp: dateCreated,
      transactionsIncluded: transactionPool.transactions.length,
      difficulty: difficulty,
      expectedReward: MINING_REWARD + rewards,
      rewardAddress: minedBy,
      blockDataHash: blockDataHash,
      transactions: validTransactions,
    };

    return prospectiveBlock;
  }

  static mineBlock(lastBlock, transactions, minedBy) {
    let hash, dateCreated;
    const prevBlockHash = lastBlock.blockHash;
    const index = lastBlock.index + 1;
    // const nonce = lastBlock.nonce;
    let { difficulty } = lastBlock;

    let blockDataHash = Block.blockHash(
      JSON.stringify({
        index: index,
        transactions: transactions,
        difficulty: difficulty,
        prevBlockHash: prevBlockHash,
        minedBy: minedBy,
      })
    );

    // generate the hash of the block (MINING WORK)
    let _nonce = 0;
    do {
      _nonce++;
      dateCreated = new Date().toISOString();
      difficulty = Block.adjustDifficulty(lastBlock, dateCreated);
      hash = Block.hash(
        dateCreated,
        prevBlockHash,
        transactions,
        _nonce,
        difficulty
      );
      // check if we have the right # of zeros (P.O.W)
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));
    if (transactions) {
      transactions.forEach((transaction) => {
        transaction.transferSuccessful = true;
      });
    }

    return new this(
      index,
      transactions,
      difficulty,
      prevBlockHash,
      minedBy,
      blockDataHash,
      _nonce,
      dateCreated,
      hash
    );
  }

  static adjustDifficulty(lastBlock, currentTime) {
    let { difficulty, dateCreated } = lastBlock;

    let lastBlockTime = new Date(dateCreated);
    let newCurrentTime = new Date(currentTime);

    let diff = newCurrentTime - lastBlockTime;
    diff = Math.floor(diff / 1e3); // seconds
    console.log(diff, `seconds passed since last block`);

    diff < MINE_RATE ? difficulty++ : difficulty--;
    return difficulty;
  }
}

module.exports = Block;
