var bitcoin = require('bitcoinjs-lib')

var createSignedTransactionWithData = function (options, callback) {
  var commonBlockchain = options.commonBlockchain
  var commonWallet = options.commonWallet
  var data = options.data
  if(!Array.isArray(data))
    data = [data]
  for(var i=0; i<data.length; i++){
    if (data[i].length > 80) {
      callback('too large', false)
      return
    }
  }
  var address = commonWallet.address
  var fee = options.fee || 1000
  var payloadScripts = []
  data.forEach(function(entry){payloadScripts.push(bitcoin.script.nullDataOutput(entry))})
  var tx = new bitcoin.TransactionBuilder(bitcoin.networks[commonWallet.network])
  commonBlockchain.Addresses.Unspents([address], function (err, addresses_unspents) {
    if (err) {
      return callback(err, false)
    }
    var unspentOutputs = addresses_unspents[0]
    var compare = function (a, b) {
      if (a.value < b.value) {
        return -1
      }
      if (a.value > b.value) {
        return 1
      }
      return 0
    }
    unspentOutputs.sort(compare)
    var unspentValue = 0
    for (var i = unspentOutputs.length - 1; i >= 0; i--) {
      var unspentOutput = unspentOutputs[i]
      if (unspentOutput.value === 0) {
        continue
      }
      unspentValue += unspentOutput.value
      tx.addInput(unspentOutput.txid, unspentOutput.vout)
      if (unspentValue - fee >= 0) {
        break
      }
    }
    payloadScripts.forEach(function(payloadScript){
      tx.addOutput(payloadScript, 0)
    })
    tx.addOutput(address, unspentValue - fee)
    var txHex = tx.tx.toHex()
    commonWallet.signRawTransaction(txHex, callback)
  })
}

var getDatum = function (options, callback) {
  var transactions = options.transactions
  var datum = []
  transactions.forEach(function (tx) {
    tx.vout.forEach(function (output) {
      if (output.scriptPubKey.type === 'nulldata') {
        var scriptPubKeyASM = output.scriptPubKey.asm
        if (scriptPubKeyASM.indexOf('OP_RETURN ') === 0) {
          var data = scriptPubKeyASM.split('OP_RETURN ')[1]
          var bufferData = new Buffer(data, 'hex')
          datum.push(bufferData)
        }
      }
    })
  })
  callback(false, datum)
}

var post = function (options, callback) {
  var data = []
  if(options.stringData){
    if(!Array.isArray(options.stringData))
      options.stringData=[options.stringData]
    options.stringData.forEach(function(string){
      data.push(new Buffer(string))
    })
  }
  if(options.data){
    if(!Array.isArray(options.data))
      options.data=[options.data]
    options.data.forEach(function(buffer){
      data.push(buffer)
    })
  }
  if(options.hexData){
    if(!Array.isArray(options.hexData))
      options.hexData=[options.hexData]
    options.hexData.forEach(function(hex){
      data.push(new Buffer(hex,'hex'))
    })
  }
  for(var i=0; i<data.length; i++){
    if (data[i].length > 80) {
      return callback('too large', false)
    }
    if (data[i].length < 1) {
      return callback('too small', false)
    }
  }
  var commonBlockchain = options.commonBlockchain
  options.data = data
  createSignedTransactionWithData(options, function (err, signedTxHex, txid) {
    if (err) {
      return callback(err, false)
    }
    var propagateResponse = function (err, res) {
      var postTx = {
        data: options.data,
        txid: txid
      }
      if (err) {
        postTx.propagateResponse = 'failure'
      } else {
        postTx.propagateResponse = 'success'
      }
      callback(err, postTx)
    }
    commonBlockchain.Transactions.Propagate(signedTxHex, propagateResponse)
  })
}

var scan = function (tx, callback) {
  getDatum({transactions: [tx]}, function (err, txs) {
    var scannedTx = {
        data: (txs.length>1)?txs:txs[0]
    }
    callback(err, scannedTx)
  })
}

var rawOpReturn = {
  post: post,
  scan: scan
}

module.exports = rawOpReturn
