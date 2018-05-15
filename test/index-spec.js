/* global jasmine expect it describe */

jasmine.getEnv().defaultTimeoutInterval = 50000

var rawOpReturn = require('../src/index')

var commonBlockchain = require('mem-common-blockchain')()

var randomString = function (length) {
  var characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  var output = ''
  for (var i = 0; i < length; i++) {
    var r = Math.floor(Math.random() * characters.length)
    output += characters.substring(r, r + 1)
  }
  return output
}

var randomHex = function (length) {
  var characters = '0123456789abcdef'
  var output = ''
  for (var i = 0; i < length; i++) {
    var r = Math.floor(Math.random() * characters.length)
    output += characters.substring(r, r + 1)
  }
  return output
}

var testCommonWallet = require('test-common-wallet')

var commonWallet = testCommonWallet({
  seed: 'test',
  network: 'testnet',
  commonBlockchain: commonBlockchain
})

describe('raw-op-return', function () {
  it('should post a random string of 80 bytes as data', function (done) {
    var data = new Buffer(randomString(80))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

  it('should post a random string of 79 bytes as data', function (done) {
    var data = new Buffer(randomString(79))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

  it('should post a random string of 40 bytes as data', function (done) {
    var data = new Buffer(randomString(40))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

  it('should post a random string of 39 bytes as data', function (done) {
    var data = new Buffer(randomString(39))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

  it('should post a random string of 41 bytes as data', function (done) {
    var data = new Buffer(randomString(41))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

  it('should not post more than 80 bytes of data', function (done) {
    var data = new Buffer(randomString(81))
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      expect(error).toBe('too large')
      expect(postedTx).toBe(false)
      done()
    })
  })

  it('should not post less than 1 byte of data', function (done) {
    var data = new Buffer(0)
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      expect(error).toBe('too small')
      expect(postedTx).toBe(false)
      done()
    })
  })

  it('should post as hex', function (done) {
    var hexData = randomHex(8)
    rawOpReturn.post({
      hexData: hexData,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      expect(postedTx.txid).toBeDefined()
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('hex')).toBe(hexData)
          done()
        })
      })
    })
  })

  it('should post as string', function (done) {
    var stringData = randomString(8)
    rawOpReturn.post({
      stringData: stringData,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      expect(postedTx.txid).toBeDefined()
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
        rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(stringData)
          done()
        })
      })
    })
  })

  it('should post random strings of 80 bytes as data', function (done) {
    var data = [ new Buffer(randomString(80)), new Buffer(randomString(80)) ]
    rawOpReturn.post({
      data: data,
      commonBlockchain: commonBlockchain,
      commonWallet: commonWallet
    }, function (error, postedTx) {
      if (error) {}
      commonBlockchain.Transactions.Get([postedTx.txid], function (err, txs) {
        if (err) {}
        var tx = txs[0]
          rawOpReturn.scan(tx, function (err, scannedTx) {
          if (err) {}
          expect(scannedTx.data.toString('utf8')).toBe(data.toString('utf8'))
          done()
        })
      })
    })
  })

})
