const Block = require('./block');


/**
 * describe is jest specific function
 * name of the object as string for which test is written
 * function that will define a series of tests
 */

describe("Block", () => {
    let data, lastBlock, block;
    // beforeEach allows you to run code before the tests

    beforeEach(()=>{
        data = 'bar';
        lastBlock = Block.genesis();
        block = Block.mineBlock(lastBlock, data);
    });

    /**
     * it function is used to write unit tests
     * first param is a description
     * second param is callback arrow function
     */

    test("sets the 'data' to match the input",() => {
        expect(block.data).toEqual(data);
    });

    test("sets the 'lastHash' to match the hash of the last block", ()=>{
        expect(block.lastHash).toEqual(lastBlock.hash);
    });

    test("sets the 'lastHash' to match the hash of the last block",()=>{
        expect(block.lastHash).toEqual(lastBlock.hash);
    });

    test("generates a hash that matches the difficulty",()=>{
        // use dynamic difficulty adjustment
        expect(block.hash.substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
    });

    test("lower the difficulty for a slower generated block",()=> {
        // 600000000 will make it very slow
        expect(Block.adjustDifficulty(block, block.timestamp + 600000000)).toEqual(block.difficulty - 1);
    });

    test("raise the difficulty for a faster generated block",()=>{
        expect(Block.adjustDifficulty(block, block.timestamp+1)).toEqual(block.difficulty+1);
    });
});