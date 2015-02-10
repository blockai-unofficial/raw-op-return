jasmine.getEnv().defaultTimeoutInterval = 50000;

var rawOpReturn = require("../src/index");

var Bitcoin = require("bitcoinjs-lib");

var helloblock = require("helloblock-js")({
  network: 'testnet'
});

var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};

var propagateTransaction = function(tx, callback) {
  helloblock.transactions.propagate(tx, function(err, res, body) {
    callback(err, res);
  });
};

var getTransaction = function(txHash, callback) {
  helloblock.transactions.get(txHash, function(err, res, tx) {
    callback(err, tx);
  });
};

var getWallet = function(callback) {
  helloblock.faucet.get(1, function(err, res, body) {
    if (err) {
      return done(err);
    }
    var privateKeyWIF = body.privateKeyWIF;
    var address = body.address;
    var unspentOutputs = body.unspents;
    var signTransaction = signFromPrivateKeyWIF(privateKeyWIF);
    var wallet = {
      signTransaction: signFromPrivateKeyWIF(privateKeyWIF),
      unspentOutputs: unspentOutputs,
      address: address
    }
    callback(err, wallet);
  });
};

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

describe("raw-op-return", function() {

  it("should post a random string of 40 bytes as data", function(done) {
    var data = new Buffer(randomString(40));
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        data: data,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(postedTx.txHash).toBeDefined();
        getTransaction(postedTx.txHash, function(err, tx) {
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'));
            done();
          });
        });
      });
    });
  });

  it("should use a fee estimator function", function(done) {
    var data = new Buffer(randomString(40));
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        fee: Bitcoin.networks.testnet.estimateFee,
        data: data,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(postedTx.txHash).toBeDefined();
        getTransaction(postedTx.txHash, function(err, tx) {
          expect(tx.fees).toBe(10000);
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'));
            done();
          });
        });
      });
    });
  });

  it("should not post more than 40 bytes of data", function(done) {
    var data = new Buffer(randomString(41));
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        data: data,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(error).toBe("too large");
        expect(postedTx).toBe(false);
        done();
      });
    });
  });

  it("should not post less than 1 byte of data", function(done) {
    var data = new Buffer(0);
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        data: data,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(error).toBe("too small");
        expect(postedTx).toBe(false);
        done();
      });
    });
  });

  it("should post as hex", function(done) {
    var hexData = randomHex(8);
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        hexData: hexData,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(postedTx.txHash).toBeDefined();
        getTransaction(postedTx.txHash, function(err, tx) {
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('hex')).toBe(hexData);
            done();
          });
        });
      });
    });
  });

  it("should post as string", function(done) {
    var stringData = randomString(8);
    getWallet(function(err, wallet) {
      if (err) {
        return done(err);
      }
      var address = wallet.address;
      var unspentOutputs = wallet.unspentOutputs;
      var signTransaction = wallet.signTransaction;
      rawOpReturn.post({
        stringData: stringData,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, postedTx) {
        expect(postedTx.txHash).toBeDefined();
        getTransaction(postedTx.txHash, function(err, tx) {
          rawOpReturn.scan(tx, function(err, scannedTx) {
            expect(scannedTx.data.toString('utf8')).toBe(stringData);
            done();
          });
        });
      });
    });
  });

});