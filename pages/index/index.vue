<template>
	<view class="uni-padding-wrap">
		<input type="text" :value="phone" class="uni-input uni-common-mt" style="border: 1px solid #EEEEEE;border-radius: 5px;"
		 @input="inputPhoneChange" placeholder="输入电话" />
		<input type="text" :value="password" class="uni-input uni-common-mt" style="border: 1px solid #EEEEEE;border-radius: 5px;"
		 placeholder="输入密码" />
		<button type="default" class="uni-common-mt" @click="register">注册</button>
	</view>
</template>

<script>
	import wallet from '../../utils/wallet.js';
	export default {
		data() {
			return {
				// 1114WdsufoBfdvmtoUCF5ap6XM39QVe3mLXV6ZnWfVHKGbSPW5oppD
				phone: '18825239857',
				password: '123456',
			}
		},
		onLoad() {

		},
		//9857
		// 1114WdsufoBfdvmtoUCF5ap6XM39QVe3mLXV6ZnWfVHKGbSPW5oppD
		// 29518d96bcbea6f6dee61a9d434b7a5e975ec3a513cf04a9b50f6f338fd683c9
		//2616
		// 1112JNiSJyAfhjLxQ6a4DR7pdvzcHwn4ypxFsAk1x3zX8eLDM3KYwv
		// 07c10e27238df093bce43b670c7f1139acffcb2e6bebf8dfa35528c1c325df3f
		methods: {
			register() {
				console.log('当前注册手机KEY:', this.phone);
				let nbc_wallet = wallet.setWallet(this.phone, this.password);
				uni.setStorage({
					key: this.phone,
					data: JSON.stringify(wallet.getWallet()),
					success: function() {
						console.log('创建区块账号成功');
						uni.navigateTo({
							 url: '../../pages/transfer/transfer'
						});
					}
				});
				
				// uni.getStorage({
				// 	key: this.phone,
				// 	success: function(res) {
				// 		// console.log('钱包信息:', res.data);
				// 		uni.showModal({
				// 			content: '钱包信息' + res.data,
				// 			showCancel: false
				// 		});
				// 	}
				// });
			},
			get() {
				uni.getStorage({
					key: this.phone,
					success: function(res) {
						uni.showModal({
							content: '钱包信息' + res.data,
							showCancel: false
						});
						// uni.showModal({
						// 	content:'钱包信息:', res.data
						// })
						// alert('钱包信息:', res.data);
						// console.log('钱包信息:', res.data);
					}
				});
			},
			inputPhoneChange(e) {
				this.phone = e.detail.value;
			},
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
