Raw OP_RETURN
===

Post and read raw OP_RETURN messages on the Bitcoin blockchain.

```
npm install raw-op-return
```

Post
---

In our examples we're going to use ```bitcoinjs-lib``` to create our wallet.

```javascript
var bitcoin = require("bitcoinjs-lib");

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
```

We'll need to provide an instance of a commonBlockchain which will provide functions for signing a transaction, propagating a trasnaction, and looking up a transaction by ```txid```.

In this example we're using the in memory version that is provided by ```abstract-common-blockchain```.


```javascript
var commonBlockchain = require("abstract-common-blockchain")({
  type: "local"
});

// var ChainAPI = require("chain-unofficial");

// var commonBlockchain = ChainAPI({
//   network: "testnet", 
//   key: process.env.CHAIN_API_KEY_ID, 
//   secret: process.env.CHAIN_API_KEY_SECRET
// });
```

And finally we're ready to post.

```javascript
rawOpReturn.post({
  stringData: "a message",
  commonWallet: commonWallet,
  commonBlockchain: commonBlockchain
}, function(error, postedTx) {
  console.log("posted data:", postedTx.data);
});
```

Scan
---

```javascript
var txid = "b9a5a9bf941fb37abec789e6aa70964075d006aeff044e932491008a0a51577d";
commonBlockchain.Transactions.Get([txid], function(err, txs) {
  var tx = txs[0];
  rawOpReturn.scan(tx, function(err, scannedTx) {
    console.log("scanned data:", scannedTx.data);
  });
});
```