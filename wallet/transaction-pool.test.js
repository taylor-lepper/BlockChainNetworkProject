
const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');

describe('Transaction Pool',()=>{

    let transactionPool, wallet, transaction, newTransaction;

    beforeEach(()=>{

        transactionPool = new TransactionPool();
        wallet = new Wallet();
        transaction = wallet.createTransaction('r4nd-addr355',30,transactionPool);

    });

    it('adds a transaction to the pool',()=>{
        // console.log(transactionPool.transactions);
        expect(transactionPool.transactions.find(t => t.id === transaction.id)).toEqual(transaction);
    });

    it('updates a transaction in the pool',()=>{
        const oldTransaction = JSON.stringify(transaction);
        newTransaction = transaction.update(wallet,'foo-4ddr355',40);
        transactionPool.updateOrAddTransaction(newTransaction);
        expect(JSON.stringify(transactionPool.transactions.find(t => t.id === transaction.id)))
        .not.toEqual(oldTransaction);
    });

});