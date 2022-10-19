import {
    AssetValue,
    AztecSdk,
    EthAddress,
    GrumpkinAddress,
    TxId,
    TxSettlementTime,
  } from "@aztec/sdk";
  
  export async function depositEthToAztec(
    depositor: EthAddress,
    recipient: GrumpkinAddress,
    tokenQuantity: bigint,
    settlementTime: TxSettlementTime,
    sdk: AztecSdk,
  ) : Promise<TxId> {
    const tokenAssetId = sdk.getAssetIdBySymbol('ETH');
    const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
      settlementTime
    ];
    const tokenAssetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };
    const tokenDepositController = sdk.createDepositController(
        depositor,
        tokenAssetValue,
        tokenDepositFee,
        recipient,
        true,
    );
    await tokenDepositController.createProof();
    await tokenDepositController.sign();
    if ((await tokenDepositController.getPendingFunds()) < tokenQuantity) {
      await tokenDepositController.depositFundsToContract();
      await tokenDepositController.awaitDepositFundsToContract();
    }
    let txId = await tokenDepositController.send();
    return txId;
  }
  
//   export async function depositTokensToAztec(
//     usersEthereumAddress: EthAddress,
//     user: AccountId,
//     token: EthAddress,
//     tokenQuantity: bigint,
//     settlementTime: TxSettlementTime,
//     sdk: AztecSdk,
//     signer: SchnorrSigner
//   ) {
//     const tokenAssetId = sdk.getAssetIdByAddress(token);
//     // ^ can also use sdk.getAssetIdBySymbol('DAI');
//     const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
//       settlementTime
//     ];
//     const tokenAssetValue: AssetValue = {
//       assetId: tokenAssetId,
//       value: tokenQuantity,
//     };
//     const tokenDepositController = sdk.createDepositController(
//       user,
//       signer,
//       tokenAssetValue,
//       tokenDepositFee,
//       usersEthereumAddress
//     );
//     await tokenDepositController.createProof();
//     await tokenDepositController.sign();
//     await tokenDepositController.approve();
//     const txHash = await tokenDepositController.depositFundsToContract();
//     await sdk.getTransactionReceipt(txHash);
//     await tokenDepositController.send();
//     // await tokenDepositController.awaitSettlement();
//     return tokenDepositController;
//   }
  