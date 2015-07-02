var Bitcoin = require("bitcoinjs-lib");

var createSignedTransactionWithData = function(options, callback) {
  var commonBlockchain = options.commonBlockchain;
  var commonWallet = options.commonWallet;
  var data = options.data;
  if (data.length > 40) {
    callback("too large", false);
    return;
  };
  var address = commonWallet.address;
  var fee = options.fee || 1000;
  var payloadScript = Bitcoin.Script.fromChunks([Bitcoin.opcodes.OP_RETURN, data]);
  var tx = new Bitcoin.TransactionBuilder();
  commonBlockchain.Addresses.Unspents([address], function(err, addresses_unspents) {
    var unspentOutputs = addresses_unspents[0];
    var compare = function(a,b) {
      if (a.value < b.value)
        return -1;
      if (a.value > b.value)
        return 1;
      return 0;
    };
    unspentOutputs.sort(compare);
    var unspentValue = 0;
    for (var i = unspentOutputs.length - 1; i >= 0; i--) {
      var unspentOutput = unspentOutputs[i];
      if (unspentOutput.value === 0) {
        continue;
      }
      unspentValue += unspentOutput.value;
      tx.addInput(unspentOutput.txid, unspentOutput.vout);
      if (unspentValue - fee >= 0) {
        break;
      }
    };
    tx.addOutput(payloadScript, 0);
    tx.addOutput(address, unspentValue - fee);
    var txHex = tx.tx.toHex();
    commonWallet.signRawTransaction(txHex, callback);
  });
};

var getDatum = function(options, callback) {
  var transactions = options.transactions;
  var datum = [];
  transactions.forEach(function(tx) {
    tx.vout.forEach(function(output) {
      if (output.scriptPubKey.type == 'nulldata') {
        var scriptPubKey = output.scriptPubKey.hex;
        if (scriptPubKey.slice(0,2) == "6a") {
          var data = scriptPubKey.slice(4, 84);
          var bufferData = new Buffer(data, "hex");
          datum.push(bufferData);
        }
      }
    });
  });
  callback(false, datum)
};

var post = function(options, callback) {
  var data;
  if (options.stringData) {
    data = new Buffer(options.stringData);
  }
  else if (options.data) {
    data = options.data;
  }
  else if (options.hexData) {
    data = new Buffer(options.hexData, "hex");
  }
  if (data.length > 40) {
    return callback("too large", false);
  }
  if (data.length < 1) {
    return callback("too small", false);
  }
  var commonBlockchain = options.commonBlockchain;
  var commonWallet = options.commonWallet;
  var propagateTransaction = options.propagateTransaction;
  options.data = data;
  createSignedTransactionWithData(options, function(err, signedTxHex, txid) {
    var propagateResponse = function(err, res) {
      var postTx = {
        data: options.data,
        txid: txid
      }
      if (err) {
        postTx.propagateResponse = "failure";
      }
      else {
        postTx.propagateResponse = "success";
      }
      callback(err, postTx);
    }
    commonBlockchain.Transactions.Propagate(signedTxHex, propagateResponse);
  });
};

var scan = function(tx, callback) {
  getDatum({transactions:[tx]}, function(err, txs) {
    var scannedTx = {
      data: txs[0]
    }
    callback(err, scannedTx);
  });
}

var rawOpReturn = {
  post: post,
  scan: scan
}

module.exports = rawOpReturn;