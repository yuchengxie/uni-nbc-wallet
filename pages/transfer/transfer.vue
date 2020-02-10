<template>
	<view class="uni-padding-wrap">
		<input type="text" :value="localAccount" class="uni-input uni-common-mt" style="border: 1px solid #EEEEEE;border-radius: 5px;"
		 placeholder="本地钱包地址" />
		<view class="uni-center uni-common-mt">||</view>
		<input type="text" :value="localAccount" class="uni-input uni-common-mt" style="border: 1px solid #EEEEEE;border-radius: 5px;"
		 @input="inputToChange" placeholder="收款钱包地址" />
		<input type="text" :value="password" class="uni-input uni-common-mt" style="border: 1px solid #EEEEEE;border-radius: 5px;"
		 placeholder="输入密码" />
		<button type="default" class="uni-common-mt" @click="get">当前钱包信息</button>
		<button type="default" class="uni-common-mt" @click="goback">返回</button>
		<button type="primary" class="uni-common-mt" @click="testapi">转账</button>
		<button type="primary" class="uni-common-mt" @click="getBalance">查询账号余额</button>

	</view>
</template>

<script>
	import wallet from "../../utils/wallet.js";
	import tran from "../../utils/transfer.js";
	import opscript from "../../utils/script";
	import bufferhelp from "../../utils/bufferhelp";
	import pack from "../../utils/pack";
	import api from "../../utils/api.js";

	export default {
		data() {
			return {
				localAccount: "",
				password: "123456",
				hash: ""
			};
		},
		methods: {
			async getBalance() {
				let w = await api.getStorage("18825239857");
				w = JSON.parse(w.data);
				let url = api.txn_state_account + '?addr=' + w.account;
				let c = await api.get(url);
				let t = pack.unpack_header(c)[0];
				let m = pack.AccState.fromStream(t);
				let f = m.found;
				let b = 0;
				for (let i = 0; i < f.length; i++) {
					b += f[i].value;
				}
				let acc=m.account;
				b=b/Math.pow(10,8);
				console.log(`地址${acc}金额数量为:${b}`);
			},
			async testapi() {
				let w = await api.getStorage("18825239857");
				w = JSON.parse(w.data);
				console.log("w:", w);
				let hash_;
				let _wait_submit = [];
				var SHEET_CACHE_SIZE = 16;
				let t = tran.prepareMakesheet();
				let makesheetMsg = t[1];
				console.log("makesheetMsg:", makesheetMsg);
				let s_orgsheetMsg = await api.post(api.txn_sheets_sheet, t[0]);
				let p_orgsheetMsg = pack.unpack_header(s_orgsheetMsg)[0];
				let orgsheetMsg = pack.OrgSheet.formStream(p_orgsheetMsg);
				console.log("orgsheetMsg:", orgsheetMsg);

				let publichash = wallet.publickey_to_hash(w.pubkey);
				let coin_hash = Buffer.concat([publichash, Buffer([0x00])]);
				let coin_hashstr = bufferhelp.bufToStr(coin_hash);

				let d = {};
				let payto = makesheetMsg.pay_to;

				for (let i = 0; i < payto.length; i++) {
					let p = payto[i];
					let ret = tran.decode_check(p.address);
					d[ret] = p.value;
				}

				for (let idx = 0; idx < orgsheetMsg.tx_out.length; idx++) {
					let item = orgsheetMsg.tx_out[idx];
					if (item.value == 0 && item.pk_script.slice(0, 2) == "6a") {
						continue;
					}
					// //tokenzier
					var tokenzier = new opscript.Tokenizer(item.pk_script, null);
					var addr = tokenzier.get_script_address();
					if (!addr) {
						console.log("Error:invalid output address idx=" + idx);
					} else {
						let value_ = d[addr];
						if (item.value != value_) {
							if (
								value_ == undefined &&
								addr.slice(4) == bufferhelp.bufToStr(coin_hash)
							) {} else {}
						}
						delete d[addr];
					}
				}
				for (let k in d) {
					if (coin_hashstr != addr.slice(4)) {
						console.log("Error: unknown output address");
					}
				}

				let pks_out0 = orgsheetMsg.pks_out[0].items;
				let pks_num = pks_out0.length;

				let tx_ins2 = [];
				let tx_In = orgsheetMsg.tx_in;

				//sign each payload
				for (let idx = 0; idx < tx_In.length; idx++) {
					let tx_in = tx_In[idx];
					if (idx < pks_num) {
						let hash_type = 1;
						let payload = pack.make_payload(
							pks_out0[idx],
							orgsheetMsg.version,
							orgsheetMsg.tx_in,
							orgsheetMsg.tx_out,
							0,
							idx,
							hash_type
						);
						console.log("ready sign payload:", payload.toString("hex"));
						let sig = wallet.sign(payload, w);

						sig = Buffer.concat([sig, wallet.CHR(hash_type)]);
						console.log(">>> sig2", bufferhelp.bufToStr(sig));
						let pub_key = bufferhelp.hexStrToBuffer(w.pubkey);
						let sig_script = Buffer.concat([
							wallet.CHR(sig.length),
							sig,
							wallet.CHR(pub_key.length),
							pub_key
						]);
						let txin = {};
						txin.prev_output = tx_in.prev_output;
						txin.sig_script = bufferhelp.bufToStr(sig_script);
						txin.sequence = tx_in.sequence;
						tx_ins2.push(txin);
					}
				}

				var txn = {};
				txn.version = orgsheetMsg.version;
				txn.tx_in = tx_ins2;
				txn.tx_out = orgsheetMsg.tx_out;
				txn.lock_time = orgsheetMsg.lock_time;
				txn.sig_raw = "";
				let txn_payload = pack.Transaction.toBinary(txn);
				txn_payload = pack.pack_header(txn_payload, "tx");
				hash_ = pack.dhash(txn_payload).toString("hex");
				let state_info = [
					orgsheetMsg.sequence,
					txn,
					"requested",
					hash_,
					orgsheetMsg.last_uocks
				];
				_wait_submit.push(state_info);
				while (_wait_submit.length > SHEET_CACHE_SIZE) {
					_wait_submit.remove(_wait_submit[0]);
				}
				let submit = true;

				if (submit) {
					let unsign_num = orgsheetMsg.tx_in.length - pks_num;
					if (unsign_num != 0) {
						console.log("Warning: some input not signed: %i", unsign_num);
						return;
					} else {
						let res = await api.post(
							api.txn_sheets_txn,
							txn_payload.toString("hex")
						);
						console.log("post txn res:", res);
						let p = pack.unpack_header(res);
						let msg3;
						console.log(">>> type:", p[1]);
						if (p[1] === "reject") {
							msg3 = pack.UdpReject.fromStream(p[0]);
							console.log("msg3:", msg3);
							console.log("err reject");
						} else if (p[1] === "confirm") {
							msg3 = pack.UdpConfirm.fromStream(p[0]);
							console.log("msg3:", msg3);
							if (msg3.hash === hash_) {
								state_info[2] = "submited";
								console.log('\nTransaction state:', );
							}
						}
					}
				}
			},
			get() {
				uni.getStorage({
					key: "18825239857",
					success(res) {
						uni.showModal({
							content: res.data,
							showCancel: false
						});
					}
				});
			},
			goback() {
				uni.navigateTo({
					url: "../../pages/index/index"
				});
			},
			inputToChange() {}
		},
		computed: {}
	};
</script>

<style>
</style>
