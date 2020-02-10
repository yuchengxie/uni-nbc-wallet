const bufferhelp = require('./bufferhelp');
const sha256 = require('js-sha256');
const bitcoinjs = require('bitcoinjs-lib');

const magic = Buffer.from([0xf9, 0x6e, 0x62, 0x74]);

let AccState = {
	fromStream(b) {
		let obj = {};
		let f = 0,
			v = 0;
		[f, v] = ftNumberI(b, f);
		obj.link_no = v;
		[f, v] = ftNumberI(b, f);
		obj.timestamp = v;
		[f, v] = ftVarString(b, f);
		v=Buffer.from(v,'hex');
		obj.account=v.toString('latin1');
		[f, v] = ftNumberI(b, f);
		obj.search = v;
		[f, v] = arrayOf(b, f, ftUockValue);
		obj.found = v;
		return obj;
	}
}

let UdpReject = {
	fromStream(b) {
		let obj = {};
		let f = 0,
			v = 0;
		[f, v] = ftNumberI(b, f);
		obj.sequence = v;
		[f, v] = ftVarString(b, f);
		obj.message = v;
		[f, v] = ftVarString(b, f);
		obj.source = v;
		return obj;
	}
}

let UdpConfirm = {
	fromStream(b) {
		let obj = {};
		let f = 0,
			v = 0;
		[f, v] = ftBytes(b, f, 32);
		obj.hash = v;
		[f, v] = ftNumberq_s(b, f);
		obj.arg = v;
		return obj;
	}
}

let Transaction = {
	toBinary(msg) {
		let b = Buffer.allocUnsafe(0);
		for (let name in msg) {
			let c;
			if (name === 'version') {
				c = dftNumberI(msg['version']);
				console.log('version:', bufferhelp.bufToStr(c));

			} else if (name === 'tx_in') {
				c = darrayof(msg['tx_in'], dftTxnIn);
			} else if (name === 'tx_out') {
				c = darrayof(msg['tx_out'], dftTxnOut);
			} else if (name === 'lock_time') {
				c = dftNumberI(msg['lock_time']);
			} else if (name === 'sig_raw') {
				c = dftVarStr(msg['sig_raw']);
			}
			b = Buffer.concat([b, c]);
		}
		return b;
	}
}

let MakeSheet = {
	toBinary(msg) {
		let b = Buffer.allocUnsafe(0);
		for (let name in msg) {
			let c;
			if (name === 'vcn') {
				c = dftNumberH(msg['vcn']);
			} else if (name === 'sequence') {
				c = dftNumberI(msg['sequence']);
			} else if (name === 'pay_from') {
				c = dftArrayPayfrom(msg['pay_from']);
			} else if (name === 'pay_to') {
				c = dftArrayPayto(msg['pay_to']);
			} else if (name === 'scan_count') {
				c = dftNumberH(msg['scan_count']);
			} else if (name === 'min_utxo') {
				c = dftNumberq_s(msg['min_utxo']);
			} else if (name === 'max_utxo') {
				c = dftNumberq_s(msg['max_utxo']);
			} else if (name === 'sort_flag') {
				c = dftNumberI(msg['sort_flag']);
			} else if (name === 'last_uocks') {
				c = dftArrayLastUocks(msg['last_uocks']);
			}
			b = Buffer.concat([b, c]);
		}
		return b;
	},
	fromStream(payload) {

	}
}

let OrgSheet = {
	formStream(b) {
		let obj = {};
		let f = 0,
			v = 0;
		[f, v] = ftNumberI(b, f);
		obj.sequence = v;
		[f, v] = arrayOf(b, f, ftVarStrList);
		obj.pks_out = v;
		[f, v] = arrayOf(b, f, ftNumberq_s);
		obj.last_uocks = v;
		[f, v] = ftNumberI(b, f);
		obj.version = v;
		[f, v] = arrayOf(b, f, ftTxnIn);
		obj.tx_in = v;
		[f, v] = arrayOf(b, f, ftTxnOut);
		obj.tx_out = v;
		[f, v] = ftNumberI(b, f);
		obj.lock_time = v;
		[f, v] = ftVarString(b, f);
		obj.signature = v;
		return obj;
	}
}

let FlexTxn = {
	toBinary(msg) {
		let b = Buffer.allocUnsafe(0);
		let c;
		for (let name in msg) {
			if (name === 'version') {
				c = dftNumberI(msg['version']);
			} else if (name === 'tx_in') {
				c = darrayof(msg["tx_in"], dftTxnIn);
			} else if (name === 'tx_out') {
				c = darrayof(msg['tx_out'], dftTxnOut);
			} else if (name === 'lock_time') {
				c = dftNumberI(msg['lock_time']);
			}
			b = Buffer.concat([b, c]);
		}
		return b;
	}
}

function arrayOf(buf, f, fn) {
	let b = buf.slice(f, f + 1);
	let len = b.readUInt8(0);
	let arr = [];
	f += 1;
	for (let i = 0; i < len; i++) {
		let v;
		[f, v] = fn(buf, f);
		arr.push(v);
	}
	return [f, arr];
}

function ftTxnIn(buf, f) {
	let obj = {},
		v = 0;
	[f, v] = ftOutPoint(buf, f);
	obj.prev_output = v;
	[f, v] = ftVarString(buf, f);
	obj.sig_script = v;
	[f, v] = ftNumberI(buf, f);
	obj.sequence = v;
	return [f, obj];
}

function darrayof(msg, fn) {

	let len = msg.length;

	let b = Buffer.allocUnsafe(0);
	let c = dftNumber(len);
	b = Buffer.concat([b, c]);
	for (let i = 0; i < len; i++) {
		// console.log('i-msg[i]:',i,msg[i]);
		c = fn(msg[i]);
		b = Buffer.concat([b, c]);
	}
	return b;
}

function dftTxnOut(msg) {
	let b = Buffer.allocUnsafe(0);
	// console.log('dftTxnOut msg:', msg);
	for (let name in msg) {
		let c;
		if (name === 'value') {
			c = dftNumberq_n(msg['value']);
			// console.log('value:', bufferhelp.bufToStr(c));
		} else if (name === 'pk_script') {
			c = dftVarStr(msg['pk_script']);
			// console.log('pk_script:', bufferhelp.bufToStr(c));
		}
		b = Buffer.concat([b, c]);
	}
	return b;
}

function dftTxnIn(msg) {
	let b = Buffer.allocUnsafe(0);
	// console.log('dftTxnIn msg:', msg);
	for (let name in msg) {
		let c;
		if (name === 'prev_output') {
			c = dftOutPoint(msg['prev_output']); //ok
			// console.log('prev_output:',bufferhelp.bufToStr(c));
		} else if (name === 'sig_script') {
			c = dftVarStr(msg['sig_script']); //ok
			// console.log('sig_script:',bufferhelp.bufToStr(c));
		} else if (name === 'sequence') {
			// console.log('msg[sequence]:',msg['sequence']);
			c = dftNumberI(msg['sequence']);
			// console.log('sequence:',bufferhelp.bufToStr(c));
		}

		b = Buffer.concat([b, c]);

	}
	return b;
}

function dftOutPoint(msg) {
	let b = Buffer.allocUnsafe(0);
	for (let name in msg) {
		let c;
		if (name === 'hash') {
			c = dftBytes(msg['hash']);
		} else if (name === 'index') {
			c = dftNumberI(msg['index']);
		}
		b = Buffer.concat([b, c]);
	}
	return b;
}

function dftBytes(msg) {
	return bufferhelp.hexStrToBuffer(msg);
}

function dftVarStr(msg) {
	let b = Buffer.allocUnsafe(0);
	let len = msg.length / 2;
	let c = dftNumber(len);
	b = Buffer.concat([b, c]);
	c = bufferhelp.hexStrToBuffer(msg);
	b = Buffer.concat([b, c]);
	return b;
}

function ftTxnOut(buf, f) {
	let obj = {},
		v = 0;
	[f, v] = ftNumberq_n(buf, f);
	obj.value = v;
	[f, v] = ftVarString(buf, f);
	obj.pk_script = v;
	return [f, obj];
}

function ftOutPoint(buf, f) {
	let obj = {},
		v = 0;
	[f, v] = ftBytes(buf, f, 32);
	obj.hash = v;
	[f, v] = ftNumberI(buf, f);
	obj.index = v;
	return [f, obj];
}

function ftBytes(buf, f, len) {
	let v = buf.slice(f, f + len);
	v = bufferhelp.bufToStr(v);
	f += len;
	return [f, v];
}

function ftNumberH(buf, f) {
	let b = buf.slice(f, f + 2);
	let v = b.readUInt16LE(0);
	f += 2;
	return [f, v];
}

function ftNumberI(buf, f) {
	let b = buf.slice(f, f + 4);
	let v = b.readUInt32LE(0);
	f += 4;
	return [f, v];
}

function ftUockValue(buf, f) {
	let obj = {},
		v;
	[f, v] = ftNumberq_s(buf, f);
	obj.uock = v;
	[f, v] = ftNumberq_n(buf, f);
	obj.value = v;
	[f, v] = ftNumberI(buf, f);
	obj.height = v;
	[f, v] = ftNumberH(buf, f);
	obj.vcn = v;
	return [f, obj];
}

function ftNumberq_s(buf, f) {
	let b = buf.slice(f, f + 8);
	f += 8;
	let v = bufferhelp.bufToStr(b);
	return [f, v];
}

function ftNumberq_n(buf, f) {
	//tx_out value
	let b = buf.slice(f, f + 8).reverse();
	f += 8;
	let v = bufferhelp.bufToNumer(b);
	return [f, v];
}

function ftVarString(buf, f) {
	let b = buf.slice(f, f + 1);
	f += 1;
	let len = b.readUInt8(0); //长度
	b = buf.slice(f, f + len);
	let v = bufferhelp.bufToStr(b);
	f += len;
	return [f, v];
}

function ftVarStrList(buf, f) {
	let b = buf.slice(f, f + 1);
	f += 1;
	let len = b.readUInt8(0);
	let v = [];
	let obj = {};
	for (let i = 0; i < len; i++) {
		let n;
		[f, n] = ftVarString(buf, f);
		v.push(n);
	}
	obj.items = v;
	return [f, obj];
}


function dftArrayPayfrom(msg) {
	var num = msg.length;
	if (num < 0XFD) {
		let b = Buffer.allocUnsafe(0);
		let c = dftNumber(num);
		b = Buffer.concat([b, c]);
		for (var i = 0; i < num; i++) {
			let pay = msg[i];
			let v = pay.value;
			c = dftNumberq_s(v);
			b = Buffer.concat([b, c]);
			var l_addr = pay.address.length;
			if (l_addr < 0xFD) {
				c = dftNumber(l_addr);
				b = Buffer.concat([b, c]);
				c = new Buffer(pay.address);
				b = Buffer.concat([b, c]);
			}
		}
		return b;
	}
}

function dftArrayPayto(msg) {
	var num = msg.length;

	if (num < 0XFD) {
		let b = Buffer.allocUnsafe(0);
		let c = dftNumber(num);
		b = Buffer.concat([b, c]);
		for (var i = 0; i < num; i++) {
			var pay = msg[i];
			var v = pay.value;
			let
				c = dftNumberq_s(v);
			b = Buffer.concat([b, c]);
			var l_addr = pay.address.length;
			if (l_addr < 0xFD) {
				c = dftNumber(l_addr);
				b = Buffer.concat([b, c]);
				if (typeof pay.address == 'string') {
					c = new Buffer(pay.address);
				} else {
					c = pay.address;
				}
				b = Buffer.concat([b, c]);
				return b;
			}
		}
	}
}

function dftArrayLastUocks(msg) {
	var num = msg.length;
	if (num < 0xFD) {
		let b = Buffer.allocUnsafe(0);
		let n = dftNumber(num);
		b = Buffer.concat([b, n]);
		for (var i = 0; i < num; i++) {
			var lastuocks = msg[i];
			let buf = dftNumberq_s(lastuocks);
			b = Buffer.concat([b, buf]);
		}
		return b;
	}
}


function dftNumber(n) {
	let b = new Buffer(1);
	b.writeUInt8(n);
	return b;
}

function dftNumberH(n) {
	let b = new Buffer(2);
	b.writeInt16LE(n);
	return b;
}


function dftNumberI(n) {
	let b = new Buffer(4);
	// b.writeInt32LE(n);
	b.writeUInt32LE(n);
	return b;
}

function dftNumberq_s(n) {
	let b = new Buffer(8);
	// b.writeInt32LE(n);
	b.writeUInt32LE(n);
	return b;
}

function dftNumberq_n(n) {
	let b = new Buffer(8);
	var c = n.toString(16);
	var d = bufferhelp.hexStrToBuffer(c).reverse();
	var j = 0;
	for (var i = 0; i < d.length; i++) {
		b[j] = d[i];
		j++;
	}
	return b;
}

function make_payload(subscript, txns_ver, txns_in, txns_out, lock_time, input_index, hash_type) {
	let tx_ins = [],
		tx_outs;
	// SIGHASH_ALL
	if ((hash_type & 0x1F) === 0x01) {
		for (let index = 0; index < txns_in.length; index++) {
			let tx_in = txns_in[index];
			let script = '';
			if (index === input_index) {
				script = subscript;
			}
			tx_in.sig_script = script;
			tx_ins.push(tx_in);
		}
		tx_outs = txns_out;
	}
	if (!tx_ins || !tx_outs) {
		throw Error('invalid signature type');
	}

	let tx_copy = {};
	tx_copy.version = txns_ver;
	tx_copy.tx_in = tx_ins;
	tx_copy.tx_out = tx_outs;
	tx_copy.lock_time = lock_time;
	let tx_copy_b = FlexTxn.toBinary(tx_copy);
	let hash_type_buf = bufferhelp.numToBuf(hash_type, false, 4);
	let b = Buffer.concat([tx_copy_b, hash_type_buf]);
	return b;
}

function unpack_header(data) {
	// if(!data) throw 'unpack_header data err';
	data = bufferhelp.hexStrToBuffer(data);
	if (data.slice(0, 4).equals(magic) != 1) {
		throw Error('bad magic number');
	}
	var buf = data.slice(16, 20);
	// var value = bufToNumer(buf);
	var value = bufferhelp.bufToNumer(buf);
	var buf = Buffer.allocUnsafe(4);
	buf.writeUInt32LE(value, 0);
	var v2 = bufferhelp.bufToNumer(buf);
	var payload = data.slice(24, 24 + v2);
	//check the checksum
	var checksum = bufferhelp.hexStrToBuffer(sha256(bufferhelp.hexStrToBuffer(sha256(payload)))).slice(0, 4);
	if (data.slice(20, 24).compare(checksum) != 0) {
		throw Error('bad checksum');
	}
	var command = data.slice(4, 16);
	var stripCommand = strip(command);
	var msg_type = stripCommand.toString('latin1');
	return [payload, msg_type];
}

function strip(buf) {
	var arr = [];
	for (var i = 0; i < buf.length; i++) {
		arr.push(buf[i]);
	}
	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i] == 0x00) {
			arr.splice(i, 1);
		} else {
			break;
		}
	}
	return Buffer.from(arr);
}

function pack_header(payload, command) {
	//4-16
	var b_command = bufferhelp.strToBuffer(command, 12);
	//16-20 payload len
	var len_command = bufferhelp.numToBuf(payload.length, false, 4);
	//20-24
	var checksum = bufferhelp.hexStrToBuffer(sha256(bufferhelp.hexStrToBuffer(sha256(payload)))).slice(0, 4);

	var b = Buffer.concat([magic, b_command, len_command, checksum, payload]);

	return b;
}

function dhash(txn_binary) {
	return bitcoinjs.crypto.sha256(bitcoinjs.crypto.sha256(txn_binary.slice(24, txn_binary.length - 1)));
	// return bitcoinjs.crypto.hash256(txn_binary.slice(24, txn_binary.length - 1));
}

module.exports = {
	AccState: AccState,
	MakeSheet: MakeSheet,
	OrgSheet: OrgSheet,
	UdpConfirm: UdpConfirm,
	UdpReject: UdpReject,
	make_payload: make_payload,
	Transaction: Transaction,
	unpack_header: unpack_header,
	pack_header: pack_header,
	dhash: dhash
}
