// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts

// export async function withdrawTokens(
//     user: AccountId,
//     recipientEthereumAddress: EthAddress,
//     token: EthAddress,
//     tokenQuantity: bigint,
//     settlementTime: TxSettlementTime,
//     sdk: AztecSdk,
//   ) {
//     const tokenAssetId = sdk.getAssetIdByAddress(token);
//     const withdrawSigner = await sdk.createSchnorrSigner((await sdk.getUserData(user)).privateKey);
//     const tokenWithdrawFee = (await sdk.getWithdrawFees(tokenAssetId))[settlementTime];
//     const tokenAssetValue = { assetId: tokenAssetId, value: tokenQuantity };
//     const tokenWithdrawController = sdk.createWithdrawController(
//       user,
//       withdrawSigner,
//       tokenAssetValue,
//       tokenWithdrawFee,
//       recipientEthereumAddress,
//     );
//     await tokenWithdrawController.createProof();
//     await tokenWithdrawController.send();
//     return tokenWithdrawController;
//   }