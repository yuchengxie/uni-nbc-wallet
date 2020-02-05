let bufferhelp = require('./bufferhelp')
let sha256 = require('js-sha256');
let dhttp = require('dhttp');
let pack = require('./pack');
let api = require('./api.js');
const bs58 = require('bs58');

let makesheet;
let orgsheetMsg;
let sequence = 1;
let WEB_SERVER_ADDR = 'http://raw0.nb-chain.net';
let magic = Buffer.from([0xf9, 0x6e, 0x62, 0x74]);

// query_sheet('', '');

// export default {
// 	async query_sheet(pay_to, from_uocks) {
// 		let ext_in = null;
// 		let submit = true;
// 		let scan_count = 0;
// 		let min_utxo = 0;
// 		let max_utxo = 0;
// 		let sort_flag = 0;
// 		// let from_uocks = null;
// 		let buf = prepare_txn1_(pay_to, ext_in, submit, scan_count, min_utxo, max_utxo, sort_flag, from_uocks);
// 		console.log('>>> 发送数据:', bufferhelp.bufToStr(buf), bufferhelp.bufToStr(buf).length);

// 		let URL = WEB_SERVER_ADDR + '/txn/sheets/sheet';
// 		orgsheetMsg = await api.post(URL, buf);

// 	}
// }

function prepareMakesheet(pay_to, from_uocks) {
	let ext_in = null;
	let submit = true;
	let scan_count = 0;
	let min_utxo = 0;
	let max_utxo = 0;
	let sort_flag = 0;
	// let from_uocks = null;
	return prepare_txn1_(pay_to, ext_in, submit, scan_count, min_utxo, max_utxo, sort_flag, from_uocks);
}

function query_sheet(pay_to, from_uocks) {
	// wallet_from = wallet
	let ext_in = null;
	let submit = true;
	let scan_count = 0;
	let min_utxo = 0;
	let max_utxo = 0;
	let sort_flag = 0;
	// let from_uocks = null;
	let buf = prepare_txn1_(pay_to, ext_in, submit, scan_count, min_utxo, max_utxo, sort_flag, from_uocks);

	// console.log('>>> 发送数据:', buf, buf.length, bufferhelp.bufToStr(buf));
	// console.log('>>> 长度:', buf.length);
	// console.log('>>> 类型:', typeof(buf));
	console.log('>>> 发送数据:', bufferhelp.bufToStr(buf), bufferhelp.bufToStr(buf).length);
	// return buf;
	// let bbb=new ArrayBuffer.from(buf);
	// console.log('bbb:',bbb);

	let URL = WEB_SERVER_ADDR + '/txn/sheets/sheet';
	// orgsheetMsg =await api.post(URL,buf);

	// uni.request({
	// 	url: URL, //仅为示例，并非真实接口地址。
	// 	method: "POST",
	// 	// data:bufferhelp.bufToStr(buf),
	// 	data: buf.buffer,
	// 	success: (res) => {
	// 		console.log(res.data);
	// 	}
	// });
	// dhttp({
	// 	method: 'POST',
	// 	url: URL,
	// 	body: buf
	// }, function (err, res) {
	// 	if (err) {
	// 		sequence = 0;
	// 		return;
	// 	}
	// 	console.log('>>> 接收数据:', res.body, bufferhelp.bufToStr(res.body), bufferhelp.bufToStr(res.body).length);
	// 	// let res_buf = res.body;
	// 	// getWaitSubmit(res_buf)
	// })
}

function getWaitSubmit(res) {
	// let payload = getPayload(res);
	// console.log('>>> payload:', payload, payload.length);
	// orgsheetMsg = packutils.FtOrgSheet.fromStream(payload, 0);
	// console.log('>>>>>> orgsheetMsg:', orgsheetMsg.V);

	// let pubkeybuf = bufferhelp.hexStrToBuffer(wallet_from.pubkey);
	// console.log('>>>>>> pubkeybuf:',pubkeybuf);
}

function prepare_txn1_(pay_to, ext_in, submit, scan_count, min_utxo, max_utxo, sort_flag, from_uocks) {
	var pay_from = [];
	var pay_from1 = {};
	pay_from1.value = 0;
	// pay_from1.address = '1118Mi5XxqmqTBp7TnPQd1Hk9XYagJQpDcZu6EiGE1VbXHAw9iZGPV';
	pay_from1.address = '1114WdsufoBfdvmtoUCF5ap6XM39QVe3mLXV6ZnWfVHKGbSPW5oppD';
	pay_from.push(pay_from1);

	var pay_to = [];
	var pay_to1 = {};
	pay_to1.value = 1 * Math.pow(10, 8);
	// pay_to1.address = '1112JNiSJyAfhjLxQ6a4DR7pdvzcHwn4ypxFsAk1x3zX8eLDM3KYwv';
	pay_to1.address = '1112JNiSJyAfhjLxQ6a4DR7pdvzcHwn4ypxFsAk1x3zX8eLDM3KYwv';
	pay_to.push(pay_to1);

	makesheet = {};
	makesheet.vcn = 0;
	makesheet.sequence = sequence;
	makesheet.pay_from = pay_from;
	makesheet.pay_to = pay_to;
	makesheet.scan_count = scan_count;
	makesheet.min_utxo = min_utxo;
	makesheet.max_utxo = max_utxo;
	makesheet.sort_flag = sort_flag;
	makesheet.last_uocks = [0];
	return [submit_txn_(makesheet, submit), makesheet];
}

function submit_txn_(msg, submit) {
	//1-4 header
	//4-16 command
	var command = new Buffer(12);
	command.write('makesheet', 0);
	let payload = pack.MakeSheet.toBinary(msg);
	//16-20 payload length
	var len_buf = new Buffer(4);
	var len = payload.length;
	len_buf.writeUInt32LE(len);
	// //20-24 checksum
	var checksum = bufferhelp.hexToBuffer(sha256(bufferhelp.hexToBuffer(sha256(payload)))).slice(0, 4);
	var b = Buffer.concat([magic, command, len_buf, checksum, payload]);
	b = bufferhelp.bufToStr(b);
	return b;
}

function getPayload(data) {
	// if (data.slice(0, 4).equals(magic) != 1) {
	//   throw Error('bad magic number');
	// }
	// let buf = data.slice(16, 20);
	// let value = bufferhelp.bufToNumer(buf);
	// buf = Buffer.allocUnsafe(4);
	// buf.writeUInt32LE(value, 0);
	// let v2 = bufferhelp.bufToNumer(buf);
	// let payload = data.slice(24, 24 + v2);
	// //check the checksum
	// let checksum = bufferhelp.hexStrToBuffer(sha256(bufferhelp.hexStrToBuffer(sha256(payload)))).slice(0, 4);
	// if (data.slice(20, 24).compare(checksum) != 0) {
	//   throw Error('bad checksum');
	// }
	// let command = data.slice(4, 16);
	// let stripCommand = strip(command);
	// let msg_type = stripCommand.toString('latin1');
	// console.log('> msg_type:', msg_type, msg_type.length);
	// return payload;
	// return Buffer.allocUnsafe(0);
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

function decode_check(v) {
	var a = bs58.decode(v);
	var ret = a.slice(0, a.length - 4);
	var check = a.slice(a.length - 4);
	var checksum = bufferhelp.hexToBuffer(sha256(bufferhelp.hexToBuffer((sha256(ret)))));
	if (checksum.compare(check) == 1) {
		return ret.slice(1);
	}
}

//流的转换
function make_payload(subscript, txns_ver, txns_in, txns_out, lock_time, input_index, hash_type) {
	var tx_outs;
	var tx_ins = [];
	// SIGHASH_ALL
	if ((hash_type & 0x1F) == 0x01) {
		for (var index = 0; index < txns_in.length; index++) {
			var tx_in = txns_in[index];
			var script = '';
			if (index == input_index) {
				script = subscript;
			}
			console.log('>>> script:', script, script.length);

			tx_in.sig_script = script;
			tx_ins.push(tx_in);

		}
		tx_outs = txns_out;
	}

	// console.log('tx_outs:', tx_outs);
	if (tx_ins == null || tx_outs == null) {
		throw Error('invalid signature type');
	}

	var tx_copy = new FlexTxn();
	tx_copy.version = txns_ver;
	tx_copy.tx_in = tx_ins;
	tx_copy.tx_out = tx_outs;
	tx_copy.lock_time = lock_time;

	console.log('>>> tx_copy msg:', tx_copy);
	// var payload = parse(tx_copy);
	// var msg = new bindMsg(gFormat.flextxn);
	// var payload = msg.binary(tx_copy, new Buffer(0));

	var payload = transbinary.compayloadTran(tx_copy);
	//hash_type to I
	var hash_type_buf = bufferhelp.numToBuf(hash_type, false, 4);
	// var s=bufferhelp.bufToStr(hash_type_buf);
	var b = Buffer.concat([payload, hash_type_buf]);

	console.log('tx_copy payload:', b, bufferhelp.bufToStr(b), b.length);
	return b;
}


module.exports = {
	prepareMakesheet,
	// query_sheet2,
	// query_sheet,
	decode_check,
	// make_payload
}