let Buffer = require('safe-buffer').Buffer;
let bip32 = require('bip32');
let createHash = require('create-hash');
let sha512 = require('js-sha512');
const sha256 = require('js-sha256');
const bs58 = require('bs58')
const bufferhelp = require('./bufferhelp');
const tran = require('./transfer');
const bitcoinjs = require('bitcoinjs-lib');
// const tran = require('./transfer_0');
// const m=require('./m');

let NBCWallet;
let rootAccount;

function init(wallet, vcn = 0) {
  this._wallet = wallet;
  this.vcn = vcn;
  this._sequence = 0;
  this._wait_submit = [];
}

function transfer() {
  tran.query_sheet();
}

function query_sheet(pay_to, ex_in = null, submit = true, scan_count = 0, min_utxo = 0, max_utxo = 0, sort_flag = 0, from_uocks = null) {
  // let msg=
}

function prepare_txn1_(pay_to, ext_in, scan_count, min_utxo, max_utxo, sort_flag, from_uocks) {

}

function setWallet(phone, password) {
  //AES待续
  let seed = phone + password;
  if (seed.length < 16 || seed.length > 32) {
    throw new Error('seed must be region in 16-32');
  }
  rootAccount = bip32.fromSeed(Buffer.from(seed));
  //反推
  // var _root = bip32.fromPrivateKey(prvkey, new Buffer.alloc(32));
  let prvkey = bufferhelp.bufToStr(rootAccount.privateKey);
  let pubkey = bufferhelp.bufToStr(rootAccount.publicKey);
  let account = makeNBCAccount();
  NBCWallet = {};
  NBCWallet.phone = phone;
  NBCWallet.password = password;
  NBCWallet.prvkey = prvkey;
  NBCWallet.pubkey = pubkey;
  NBCWallet.account = account;
  return NBCWallet;
}

function makeNBCAccount() {
  let pubbuf = rootAccount.publicKey;
  let hashbuf = sha512.array(pubbuf);
  let s1 = createHash('ripemd160').update(Buffer.from(hashbuf.slice(0, 32), 'hex')).digest();
  let s2 = createHash('ripemd160').update(Buffer.from(hashbuf.slice(32, 64), 'hex')).digest();
  let version = 0x00,
    cointype = 0x00,
    vcn = 0x00,
    hi = (vcn & 0xffff) / 256,
    lo = (vcn & 0xffff) % 256;
  let buf0 = bufferhelp.hexToBuffer(sha256(Buffer.concat([s1, s2])));
  let v = Buffer.concat([Buffer.from([version]), Buffer.from([hi, lo]), buf0, Buffer.from([cointype])]);
  let d1buf = bufferhelp.hexToBuffer(sha256(v));
  let checksum = bufferhelp.hexToBuffer(sha256(d1buf)).slice(0, 4);
  let result = Buffer.concat([v, checksum]);
  let addr = bs58.encode(result);
  return addr;
}

function getWallet() {
  return NBCWallet;
}

function publickey_to_hash(pubkey) {
  console.log('pubkey:', pubkey);
  if (typeof pubkey === 'string') {
    pubkey = bufferhelp.hexStrToBuffer(pubkey);
  }
  console.log('pubkey', pubkey, pubkey.length);
  let pubHash = sha512(pubkey);
  let pubHashBuf = bufferhelp.hexStrToBuffer(pubHash);
  let s1 = bitcoinjs.crypto.ripemd160(pubHashBuf.slice(0, 32));
  let s2 = bitcoinjs.crypto.ripemd160(pubHashBuf.slice(32, 64));
  return bitcoinjs.crypto.sha256(Buffer.concat([s1, s2]));
}

function sign(buf, w) {
  if (!w) return '';
  let hash = bitcoinjs.crypto.hash256(buf);
  // let hash = bitcoinjs.crypto.hash256(bitcoinjs.crypto.hash256(buf));
  let prvkey_buf = bufferhelp.hexStrToBuffer(w.prvkey);

  let b = bip32.fromPrivateKey(prvkey_buf, new Buffer(32));
  let wif = b.toWIF();
  let keyPair = bitcoinjs.ECPair.fromWIF(wif);
  let pubkey_buf = bufferhelp.hexStrToBuffer(w.pubkey);
  let signature = keyPair.sign(hash).toDER();
  console.log('打印公钥以便验证签名:', keyPair.getPublicKeyBuffer().toString('hex'));
  return signature;
}

function sign2(data, w) {
  if (!w) throw 'wallet error';
  let hash = bitcoinjs.crypto.sha256(bitcoinjs.crypto.sha256(data));
  let prvKeyBuf = Buffer.from(w.prvkey, 'hex');
  let b = bip32.fromPrivateKey(prvKeyBuf, new Buffer(32));
  let _ECPair = bitcoinjs.ECPair.fromWIF(b.toWIF());
  let signature = _ECPair.sign(hash).toDER();
  return signature;
}

function verify2(w, data, signature) {
  signature=bitcoinjs.ECSignature.fromDER(signature);
  let hash = bitcoinjs.crypto.sha256(bitcoinjs.crypto.sha256(data));
  let pubKeyOnlyECPair = bitcoinjs.ECPair.fromPublicKeyBuffer(Buffer.from(w.pubkey, 'hex'));
  let result = pubKeyOnlyECPair.verify(hash, signature);
  console.log('签名验证:', result);

}

function CHR(n) {
  var buf = new Buffer(1);
  buf.writeInt8(n);
  return buf;
}


// function toDER(x) {
//   let i = 0;
//   while (x[i] === 0) ++i;
//   if (i === x.length) return ZERO;
//   x = x.slice(i);
//   if (x[0] & 0x80) return Buffer.concat([ZERO, x], 1 + x.length);
//   return x;
// }

function getTxnHash(res){
  // let payload=
  let msg3 = pack.unpack_header(res);
  // if(msg3)
}

module.exports = {
  setWallet: setWallet,
  getWallet: getWallet,
  transfer: transfer,
  publickey_to_hash: publickey_to_hash,
  sign: sign2,
  verify: verify2,
  CHR: CHR
}