Raw OP_RETURN
===

Post and read raw OP_RETURN messages on the Bitcoin blockchain.

```
npm install raw-op-return
```

Post
---

In our examples we're going to use the ```bitcoinjs-lib``` and the ```helloblock-js``` test faucet to get and process our private key, public address and unspent outputs.

```javascript
var Bitcoin = require("bitcoinjs-lib");

var helloblock = require("helloblock-js")({
  network: 'testnet'
});

helloblock.faucet.get(1, function(err, res, body) {

  var privateKeyWIF = body.privateKeyWIF;
  var address = body.address;
  var unspentOutputs = body.unspents;
  
  // ...
  
});
```

We'll need to provide a few of your own functions.

Signing a transaction:
```javascript
var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};
var signTransaction = signFromPrivateKeyWIF(privateKeyWIF);
```

Propagating a transaction:
```javascript
var propagateTransaction = function(tx, callback) {
  helloblock.transactions.propagate(tx, function(err, res, body) {
    callback(err, res);
  });
};
```

Looking up and parsing a transaction:
```javascript
var getTransaction = function(txHash, callback) {
  helloblock.transactions.get(txHash, function(err, res, tx) {
    callback(err, tx);
  });
};
```

And finally we're ready to post.

```javascript
rawOpReturn.post({
  stringData: "a message",
  address: address,
  unspentOutputs: unspentOutputs,
  propagateTransaction: propagateTransaction,
  signTransaction: signTransaction
}, function(error, postedTx) {
  console.log("posted data:", postedTx.data);
});
```

Scan
---

```javascript
var txHash = "b9a5a9bf941fb37abec789e6aa70964075d006aeff044e932491008a0a51577d";
getTransaction(txHash, function(err, tx) {
  rawOpReturn.scan(tx, function(err, scannedTx) {
    console.log("scanned data:", scannedTx.data);
  });
});
```