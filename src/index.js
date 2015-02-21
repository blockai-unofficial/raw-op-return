var Bitcoin = require("bitcoinjs-lib");

var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};

var signFromTransactionHex = function(signTransactionHex) {
  if (!signTransactionHex) {
    return false;
  }
  return function(tx, callback) {
    var txHex = tx.tx.toHex();
    signTransactionHex(txHex, function(error, signedTxHex) {
      var signedTx = Bitcoin.TransactionBuilder.fromTransaction(Bitcoin.Transaction.fromHex(signedTxHex));
      callback(error, signedTx);
    });
  };
};

var createSignedTransactionWithData = function(options, callback) {
  var signTransaction = options.signTransaction || signFromTransactionHex(options.signTransactionHex) || signFromPrivateKeyWIF(options.privateKeyWIF);
  options.signTransaction = signTransaction;
  var data = options.data;
  if (data.length > 40) {
    callback("too large", false);
    return;
  };
  var address = options.address;
  var fee = options.fee || function(){return 1000}; // fee estimator function
  var payloadValue = options.value || 0;
  var privateKeyWIF = options.privateKeyWIF;
  var payloadScript = Bitcoin.Script.fromChunks([Bitcoin.opcodes.OP_RETURN, data]);
  var tx = new Bitcoin.TransactionBuilder();
  tx.addOutput(payloadScript, payloadValue);
  var unspentOutputs = options.unspentOutputs;
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
    tx.addInput(unspentOutput.txHash, unspentOutput.index);
    if (unspentValue - fee(tx.buildIncomplete()) >= 0) {
      break;
    }
  };
  tx.addOutput(address, unspentValue - fee(tx.buildIncomplete()));
  signTransaction(tx, function(err, signedTx) {
    var signedTxBuilt = signedTx.build();
    var signedTxHex = signedTxBuilt.toHex();
    var txHash = signedTxBuilt.getId();
    callback(false, signedTxHex, txHash);
  });
};

var getDatum = function(options, callback) {
  var transactions = options.transactions;
  var datum = [];
  var outputs = [];
  transactions.forEach(function(tx) {
    tx.outputs.forEach(function(output) {
      if (output.type == 'nulldata') {
        var scriptPubKey = output.scriptPubKey;
        if (scriptPubKey.slice(0,2) == "6a") {
          var data = scriptPubKey.slice(4, 84);
          var bufferData = new Buffer(data, "hex");
          datum.push(bufferData);
          outputs.push(output);
        }
      }
    });
  });
  callback(false, datum, outputs)
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
  var propagateTransaction = options.propagateTransaction;
  options.data = data;
  createSignedTransactionWithData(options, function(err, signedTxHex, txHash) {
    var propagateResponse = function(err, res) {
      var postTx = {
        data: options.data,
        txHash: txHash
      }
      if (err) {
        postTx.propagateResponse = "failure";
      }
      else {
        postTx.propagateResponse = "success";
      }
      callback(err, postTx);
    }
    propagateTransaction(signedTxHex, propagateResponse);
  });
};

var scan = function(tx, callback) {
  getDatum({transactions:[tx]}, function(err, txs, txo) {
    var scannedTx = {
      data: txs[0],
      output: txo[0]
    }
    callback(err, scannedTx);
  });
}

var rawOpReturn = {
  post: post,
  scan: scan
}

module.exports = rawOpReturn;