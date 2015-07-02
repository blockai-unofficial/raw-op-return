jasmine.getEnv().defaultTimeoutInterval = 50000;

var rawOpReturn = require("../src/index");

var commonBlockchain = require("abstract-common-blockchain")({
  type: "local"
});

// uncomment this to use chain for testnet integration tests

// var ChainAPI = require("chain-unofficial");

// var commonBlockchain = ChainAPI({
//   network: "testnet", 
//   key: process.env.CHAIN_API_KEY_ID, 
//   secret: process.env.CHAIN_API_KEY_SECRET
// });

var bitcoin = require("bitcoinjs-lib");

var randomString = function(length) {
  var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var output = '';
  for (var i = 0; i < length; i++) {
    var r = Math.floor(Math.random() * characters.length);
    output += characters.substring(r, r + 1);
  }
  return output;
};

var randomHex = function(length) {
  var characters = "0123456789abcdef";
  var output = '';
  for (var i = 0; i < length; i++) {
    var r = Math.floor(Math.random() * characters.length);
    output += characters.substring(r, r + 1);
  }
  return output;
};

var seed = bitcoin.crypto.sha256("test");
var wallet = new bitcoin.Wallet(seed, bitcoin.networks.testnet);
var address = wallet.generateAddress();

var signRawTransaction = function(txHex, cb) {
  var tx = bitcoin.Transaction.fromHex(txHex);
  var signedTx = wallet.signWith(tx, [address]);
  var txid = signedTx.getId();
  var signedTxHex = signedTx.toHex();
  cb(false, signedTxHex, txid);
};

var commonWallet = {
  signRawTransaction: signRawTransaction,
  address: address
}

describe("raw-op-return", function() {

  it("should post a random string of 40 bytes as data", function(done) {
    var data = new Buffer(randomString(40));
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function(error, postedTx) {
      expect(postedTx.txid).toBeDefined();
      console.log("sleeping for 1.5 seconds...");
      setTimeout(function() {
        commonBlockchain.Transactions.Get([postedTx.txid], function(err, txs) {
          var tx = txs[0];
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'));
            done();
          });
        });
      }, 1500);

    });
  });

  it("should not post more than 40 bytes of data", function(done) {
    var data = new Buffer(randomString(41));
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function(error, postedTx) {
      expect(error).toBe("too large");
      expect(postedTx).toBe(false);
      done();
    });
  });

  it("should not post less than 1 byte of data", function(done) {
    var data = new Buffer(0);
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function(error, postedTx) {
      expect(error).toBe("too small");
      expect(postedTx).toBe(false);
      done();
    });
  });

  it("should post as hex", function(done) {
    var hexData = randomHex(8);
    rawOpReturn.post({
      hexData: hexData,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function(error, postedTx) {
      expect(postedTx.txid).toBeDefined();
      console.log("sleeping for 1.5 seconds...");
      setTimeout(function() {
        commonBlockchain.Transactions.Get([postedTx.txid], function(err, txs) {
          var tx = txs[0];
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('hex')).toBe(hexData);
            done();
          });
        });
      }, 1500);
    });
  });

  it("should post as string", function(done) {
    var stringData = randomString(8);
    rawOpReturn.post({
      stringData: stringData,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function(error, postedTx) {
      expect(postedTx.txid).toBeDefined();
      console.log("sleeping for 1.5 seconds...");
      setTimeout(function() {
        commonBlockchain.Transactions.Get([postedTx.txid], function(err, txs) {
          var tx = txs[0];
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('utf8')).toBe(stringData);
            done();
          });
        });
      }, 1500);
    });
  });

});