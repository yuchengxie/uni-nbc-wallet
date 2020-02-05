let Buffer = require('safe-buffer').Buffer;
let bip32 = require('bip32');
let createHash = require('create-hash');
let bs58check = require('bs58check');

let dict_schema_ = '@DICT';
let byte_schema_ = '@BYTE';
let rootAccount;
let openAccount;

module.exports = {
	getOpenAccount() {
		return openAccount || ''
	},
	seedToAccount(rootSeed) {
		rootAccount = bip32.fromSeed(Buffer.from(rootSeed));
		openAccount = rootAccount.derivePath("m/44'/0'/0/0/0/0/0/888");
		return openAccount;
	},

	makeNbcPubAddr(pubKey, ver) {
		// step 1: public key --> public hash
		var h = createHash('sha512').update(pubKey).digest();
		var HL = createHash('ripemd160').update(h.slice(0, 32)).digest();
		var HR = createHash('ripemd160').update(h.slice(32, 64)).digest();
		var pubHash = createHash('sha256').update(HL).update(HR).digest();
		
		// step 2: prepare first 36 bytes of middle-addr: ver1 vcn2 hash32 cointype1
		var buf = Buffer.allocUnsafe(36);
		buf[0] = ver;
		buf[1] = 0;
		buf[2] = 0; // vcn fixed to 0
		pubHash.copy(buf, 3, 0, 32); // copy pubHash[0:32] to buf[3:]
		buf[35] = 0; // cointype = 0

		// step 3: make checkcode and append it to middle-addr, then translate to base58
		return bs58check.encode(buf); // add 4 bytes check code (double_hash[0:4])
	},

	sha256x2(buffer) { // buffer can be utf-8 string
		var tmp = createHash('sha256').update(buffer).digest();
		return createHash('sha256').update(tmp).digest();
	},

	serial_msg(msg) {
		console.log('serial_msg:', msg);
		var tp = msg === null ? 'null' : (msg instanceof Buffer ? 'bytes' : typeof(msg));
		if (tp == 'object') {
			if (typeof msg.length == 'number' && typeof msg.splice === 'function' && !msg.propertyIsEnumerable('length'))
				tp = 'array';
		}

		if (tp == 'object') {
			var attr, names = [];
			for (attr in msg) {
				if (msg.hasOwnProperty(attr))
					names.push(attr);
			}
			names.sort();

			var bRet = [dict_schema_];
			for (var i = 0; attr = names[i]; i++) {
				bRet.push([attr, this.serial_msg(msg[attr])]);
			}
			return bRet
		} else if (tp == 'bytes') {
			var bRet = msg.toJSON().data;
			bRet.splice(0, 0, byte_schema_);
			return bRet;
		} else return msg; // no changing
		// return msg;
	},

	unserial_msg(msg) {
		var tp = msg === null ? 'null' : typeof(msg);
		if (tp == 'object') {
			if (typeof msg.length == 'number' && typeof msg.splice == 'function' && !msg.propertyIsEnumerable('length'))
				tp = 'array';
		}

		if (tp == 'array' && msg.length > 0) {
			var schema = msg[0];
			if (schema == dict_schema_) {
				var dRet = {},
					size = msg.length;
				for (var i = 1; i < size; i++) {
					dRet[msg[i][0]] = this.unserial_msg(msg[i][1]);
				}
				return dRet;
			} else if (schema == byte_schema_)
				return Buffer.from(msg.slice(1));
		}

		return msg;
	}
}



// f96e62746f72677368656574000000003c010000f01887650100000001012876b8230000db83cf42e02199d4fa29d14a197a167ade519298f0c2f98ec5478092497bcd5c00b7ac01010010000087b80101000000016266ac9cddb79116d547b0ad3585effc0a9bd48f340fec780d1289911f49d415010000006e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffff0200e1f505000000002876b8230000e5c7b20d5b5037f86e9861cd8795be42e8093c61bd36256a2b5a22df6508a8ba00b7ac34f0ca7a040000002876b8230000db83cf42e02199d4fa29d14a197a167ade519298f0c2f98ec5478092497bcd5c00b7ac0000000000