const Blockchain = require("./index");
const Block = require('./block');

describe("Blockchain",()=>{
    let blockchain, blockchain2;

    beforeEach(()=>{
        blockchain = new Blockchain();
        blockchain2 = new Blockchain();
    });

    // genesis() and addBlock() functions

    test('starts with the genesis block',()=>{
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    test('adds a new block', ()=> {
        const data = "data";
        blockchain.addBlock(data);
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(data);
    });

    // validChain() function 
    test('validates a valid chain',()=>{
        blockchain2.addBlock('data');
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(true);
    });

    test('invalidates a chain with a corrupt genesis block',()=>{
        blockchain2.chain[0].data = 'bad data';
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    test('invalidates a corrupt chain',()=>{
        blockchain2.addBlock('data');
        blockchain2.chain[1].data = 'not data'
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    // replaceChain() function
    test('replaces the chain with a valid chain',()=>{
        blockchain2.addBlock('some data');
        blockchain2.addBlock('some more data');
        blockchain.replaceChain(blockchain2.chain);
        expect(blockchain.chain).toEqual(blockchain2.chain);
    });

    test('does not replace the chain with one that is shorter or equal length',()=>{
        blockchain.addBlock('some data');
        blockchain.replaceChain(blockchain2.chain);
        expect(blockchain.chain).not.toEqual(blockchain2.chain);
    });

});