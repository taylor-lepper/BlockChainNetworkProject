const SHA256 = require("crypto-js/sha256");
const CryptoJS = require("crypto-js");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // secp256k1 is the algorithm to generate key pair
const ethers = require("ethers");
const { v1: uuidv1 } = require("uuid");

class ChainUtil {
  static genKeyPair() {
    return ec.genKeyPair();
  }

  static getPrivateKey(keyPair) {
    return keyPair.getPrivate("hex");
  }

  static computeAddressFromPrivKey(privateKey) {
    var keyPair = ec.genKeyPair();
    keyPair._importPrivate(privateKey, "hex");
    var compact = false;
    var pubKey = keyPair.getPublic(compact, "hex").slice(2);
    var pubKeyWordArray = CryptoJS.enc.Hex.parse(pubKey);
    var hash = CryptoJS.SHA3(pubKeyWordArray, { outputLength: 256 });
    var address = hash.toString(CryptoJS.enc.Hex).slice(24);

    return address;
  }

  static id() {
    return uuidv1();
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }

  static verifySignature(publicKey, signature, dataHash) {
    console.log(publicKey);
    publicKey = publicKey.substring(2);
    return ec.keyFromPublic(publicKey, "hex").verify(dataHash, signature);
  }

  static compressPublicKey(publicKey) {
    return ethers.utils.computePublicKey(publicKey, true);
  }

  static deCompressPublicKey(publicKey) {
    return ethers.utils.computePublicKey(publicKey);
  }

  static coinFromMicroCoin(microAmount) {
    return microAmount / 1000000;
  }

  static microFromCoin(coinAmount) {
    return coinAmount * 1000000;
  }

  static walletPretty(wallet) {
    const {
      name,
      balance,
      privateKey,
      publicKey,
      address,
      publicKeyCompressed,
    } = wallet;
    return (wallet = {
      name: name,
      balance: balance,
      privateKey: privateKey,
      publicKey: publicKey,
      address: address,
      publicKeyCompressed: publicKeyCompressed,
    });
  }

  static walletBalancePretty(wallet) {
    const { name, balance, address } = wallet;
    return (wallet = {
      name: name,
      address: address,
      balance: balance,
    });
  }

  static randomNum() {
    // (Math.random() * (max - min + 1) + min)    (min = 1, max = 15)
    return Math.floor(Math.random() * (15 - 1  + 1) + 1);
  }

  static randomNameGenerator() {
    const animals = [
      "python",
      "dog",
      "platypus",
      "squirrel",
      "chimpanzee",
      "dolphin",
      "manatee",
      "worm",
      "starfish",
      "seagull",
      "baby-goat",
      "bearded-dragon",
      "crow",
      "meerkat",
      "cockroach"
    ];
    const numbers = [37, 42, 99, 86, 77, 33, 10, 22, 93, 11, 17, 23, 88, 44, 67];
    const things = [
      "trashcans",
      "pictures",
      "go-karts",
      "door-mats",
      "wet-blankets",
      "flowers",
      "tidepods",
      "dirty-towels",
      "two-and-a-half-thirds-full-cups",
      "trees-blowing-in-the-wind",
      "table",
      "usb-c-cords",
      "air-guitars",
      "small-origamis",
      "televion-sets"
    ];
    const foods = [
      "cheeseburger",
      "coors-light",
      "banana",
      "curry",
      "pickle",
      "hot-pocket",
      "burrito",
      "coffee",
      "cereal",
      "milk",
      "wheat-thin",
      "banana-bread",
      "tea",
      "spaghetti-and-a-meat-a-balls",
      "drunken-noodle"
    ];
  
    let name = `${numbers[this.randomNum() -1 ]} ${animals[this.randomNum() -1]} ${foods[this.randomNum()-1]} ${things[this.randomNum()-1]}`;
    return name;
  }
}

// test

// let keyPair = ec.genKeyPair("hex")
// console.log("keypair.priv")
// console.log(keyPair.priv);
// let publicKey = keyPair.getPublic().encode("hex");
// console.log("publicKey");
// console.log(publicKey);
// let privKey =  keyPair.getPrivate("hex");
// console.log("privKey");
// console.log(privKey);

// let address = ChainUtil.computeAddressFromPrivKey(privKey);
// console.log("address");
// console.log(address);

// let wallet =  ethers.Wallet.createRandom();
// console.log(wallet);
// console.log("publicKey");
// console.log(wallet.publicKey);
// console.log("\nprivateKey");
// console.log(wallet.privateKey);

// let compressed = ethers.utils.computePublicKey(wallet.publicKey, true);
// console.log("\npublicKey compressed");
// console.log(compressed);

// let deCompressed = ethers.utils.computePublicKey(wallet.publicKey);
// console.log("\npublicKey deCompressed");
// console.log(deCompressed);

module.exports = ChainUtil;
