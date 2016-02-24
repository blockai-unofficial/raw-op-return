Raw OP_RETURN
===

Post and read raw OP_RETURN messages on the Bitcoin blockchain.

```
npm install raw-op-return
```

Post
---

In our examples we're going to use ```test-common-wallet``` to create our wallet.

```javascript
var testCommonWallet = require('test-common-wallet')

var commonWallet = testCommonWallet({
  seed: 'test',
  network: 'testnet',
  commonBlockchain: commonBlockchain
})
```

We'll need to provide an instance of a commonBlockchain which will provide functions for signing a transaction, propagating a transaction, and looking up a transaction by ```txid```.

In this example we're using the in memory version that is provided by ```mem-common-blockchain```.


```javascript
var commonBlockchain = require("mem-common-blockchain")()
```

And finally we're ready to post.

```javascript
rawOpReturn.post({
  stringData: "a message",
  commonWallet: commonWallet,
  commonBlockchain: commonBlockchain
}, function(error, postedTx) {
  console.log("posted data:", postedTx.data)
})
```

Scan
---

```javascript
var txid = "b9a5a9bf941fb37abec789e6aa70964075d006aeff044e932491008a0a51577d"
commonBlockchain.Transactions.Get([txid], function(err, txs) {
  var tx = txs[0]
  rawOpReturn.scan(tx, function(err, scannedTx) {
    console.log("scanned data:", scannedTx.data)
  })
})
```