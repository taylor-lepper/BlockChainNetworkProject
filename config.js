const DIFFICULTY = 3;

// milliseconds
const MINE_RATE = 3000;

const MICRO_COIN = BigInt(1);
const MILLI_COIN = MICRO_COIN * BigInt(1000);
const COIN = MILLI_COIN * BigInt(1000);

const MINIMUM_TRANSACTION_FEE = BigInt(10) * MICRO_COIN;
const INITIAL_BALANCE = BigInt(1009999999999999) * MICRO_COIN;

const MINING_REWARD = BigInt(5000000) * MICRO_COIN;
const FAUCET_REWARD = BigInt(5000000) * MICRO_COIN;

const FAUCET_TRANSACTION = {
    "input": {
      "transactionHash": "Genesis-Transaction-Hash",
      "dateCreated": "1991-10-01T00:00:00.000Z",
      "senderBalance": INITIAL_BALANCE,
      "senderAddress": "blockchain-reward-wallet",
      "senderPublicKey": "0x04d74e636a437e38f42209125c2fa7f76bdfb164447352f00cb8ff7da895d36fddd56d0c6a0f5f6d732ff5d8c4ee02fda6a7d94a4efdf2d49af0e122673ae757bf",
      "signature": {
          "r": "0x00",
          "s": "0x00",
          "recoveryParam": 0
      }
  },
    "outputs": [
      {
          "newSenderBalance": BigInt(1000000000000000),
          "address": "blockchain-reward-wallet"
      },
      {
          "sentAmount": BigInt(9999999999999),
          "gas": BigInt(0),
          "address": "faucet-wallet"
      }
  ],
    "minedInBlockIndex": 0,
    "transferSuccessful": true
  }
  
module.exports = {DIFFICULTY, MINE_RATE, INITIAL_BALANCE, MINING_REWARD, COIN, MICRO_COIN, MILLI_COIN, MINIMUM_TRANSACTION_FEE, FAUCET_TRANSACTION, FAUCET_REWARD};