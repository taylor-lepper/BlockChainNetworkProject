const DIFFICULTY = 4;

// milliseconds
const MINE_RATE = 3000;

const MICRO_COIN = BigInt(1);
const MILLI_COIN = MICRO_COIN * BigInt(1000);
const COIN = MILLI_COIN * BigInt(1000);

const MINIMUM_TRANSACTION_FEE = BigInt(10) * MICRO_COIN;
const INITIAL_BALANCE = BigInt(1000000000000000) * MICRO_COIN;

const MINING_REWARD = BigInt(5000000) * MICRO_COIN;
const FAUCET_REWARD = BigInt(5000000) * MICRO_COIN;

const FAUCET_TRANSACTION = {
    "from": "blockchain-reward-wallet",
    "to": "faucet-wallet",
    "amount": BigInt(9999999999999),
    "gas": 0,
    "dateCreated": "Genesis-Chapter2",
    "senderPubKey": "0x00",
    "transactionDataHash": "From the Genesis",
    "signature": ["0x00", "0x00"],
    "blockToBeMinedIn": 0,
    "transferSuccessful": true
  }

module.exports = {DIFFICULTY, MINE_RATE, INITIAL_BALANCE, MINING_REWARD, COIN, MICRO_COIN, MILLI_COIN, MINIMUM_TRANSACTION_FEE, FAUCET_TRANSACTION, FAUCET_REWARD};