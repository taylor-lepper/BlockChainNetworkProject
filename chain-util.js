const SHA256 = require("crypto-js/sha256");
const CryptoJS = require('crypto-js');
const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // secp256k1 is the algorithm to generate key pair
const ethers = require('ethers');
const { v1: uuidv1 } = require('uuid');


class ChainUtil {
  static genKeyPair() {
    return ec.genKeyPair();
  }

  static getPrivateKey(keyPair){
    return keyPair.getPrivate("hex");
  }

  static computeAddressFromPrivKey(privateKey) {
    var keyPair = ec.genKeyPair();
    keyPair._importPrivate(privateKey, 'hex');
    var compact = false;
    var pubKey = keyPair.getPublic(compact, 'hex').slice(2);
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

  static verifySignature(publicKey, signature, dataHash){
   console.log(publicKey);
   publicKey = publicKey.substring(2);
    return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
  }
  
  static compressPublicKey(publicKey){
    return ethers.utils.computePublicKey(publicKey, true);
  }

  static deCompressPublicKey(publicKey){
    return ethers.utils.computePublicKey(publicKey);
  }

  static coinFromMicroCoin(microAmount){
    return microAmount / 1000000;
  }

  static microFromCoin(coinAmount){
    return coinAmount * 1000000;
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
