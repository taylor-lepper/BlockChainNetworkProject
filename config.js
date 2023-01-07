const DIFFICULTY = 4>>>0;

// milliseconds
const MINE_RATE = 7; // seconds


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
      "senderSafeBalance": INITIAL_BALANCE,
      "senderAddress": "0x00000000000000000000000000000000000000",
      "senderPublicKey": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "signature": {
          "r": "0x00",
          "s": "0x00",
          "recoveryParam": 0
      }
  },
    "outputs": [
      {
          "newSenderSafeBalance": BigInt(1000000000000000),
          "address": "0x00000000000000000000000000000000000000"
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