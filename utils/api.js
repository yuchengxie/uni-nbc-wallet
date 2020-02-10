let bh = require('./bufferhelp.js');
let BASE_URL = 'http://raw0.nb-chain.net';
let txn_sheets_sheet = BASE_URL + '/txn/sheets/sheet';
let txn_sheets_txn = BASE_URL + '/txn/sheets/txn';
let txn_state_account = BASE_URL + '/txn/state/account';
export default {
	txn_sheets_sheet,
	txn_sheets_txn,
	txn_state_account,
	toBase64(s) {
		let b;
		if (typeof s === 'string') {
			console.log('send:', s);
			b = bh.hexStrToBuffer(s);
			b = b.toString('base64');
		} else if (typeof s === 'buffer') {
			b = s.toString('base64');
		}
		return b;
	},
	post(url, data) {
		console.log('send data:', data);
		data = this.toBase64(data);
		return new Promise((resolve, reject) => {
			uni.request({
				url: url,
				method: "POST",
				data: data,
				header: {
					'content-type': 'text/plain'
				},
				success(res) {
					data = Buffer.from(res.data, 'latin1');
					data = data.toString('hex');
					console.log('post res:', data, data.length);
					resolve(data);
				},
				fail(err) {
					reject(err);
				}
			})
		})
	},

	get(url) {
		return new Promise((resolve, reject) => {
			uni.request({
				url: url,
				method: "GET",
				success(res) {
					let data = Buffer.from(res.data, 'latin1');
					data = data.toString('hex')
					resolve(data);
				},
				fail(err) {
					reject(err);
				}
			})
		})
	},


	getStorage(key) {
		return new Promise((resolve, reject) => {
			uni.getStorage({
				key: key,
				success: function(res) {
					resolve(res);
				},
				fail(err) {
					reject(err);
				}
			});
		})
	}
}
