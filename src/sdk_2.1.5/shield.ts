import {
    AssetValue,
    AztecSdk,
    EthAddress,
    GrumpkinAddress,
    TxSettlementTime,
  } from "@aztec/sdk";
  
  export async function depositEthToAztec(
    depositor: EthAddress,
    recipient: GrumpkinAddress,
    tokenQuantity: bigint,
    settlementTime: TxSettlementTime,
    sdk: AztecSdk,
  ) {
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
    // TODO: check if there is a pending deposit, if so skip to send()
    await tokenDepositController.depositFundsToContract(); // for ETH, returns txHash
    await tokenDepositController.awaitDepositFundsToContract();
    await tokenDepositController.send();
    return tokenDepositController;
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
  