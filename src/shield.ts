import {
  AccountId,
  AssetValue,
  AztecSdk,
  EthAddress,
  TxSettlementTime,
  WalletProvider,
} from "@aztec/sdk";

export async function depositEthToAztec(
  usersEthereumAddress: EthAddress,
  user: AccountId,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  provider: WalletProvider
) {
  const tokenAssetId = sdk.getAssetIdBySymbol('ETH');
  const signer = await sdk.createSchnorrSigner(
    provider.getPrivateKeyForAddress(usersEthereumAddress)!
  );
  const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue: AssetValue = {
    assetId: tokenAssetId,
    value: tokenQuantity,
  };
  const tokenDepositController = sdk.createDepositController(
    user,
    signer,
    tokenAssetValue,
    tokenDepositFee,
    usersEthereumAddress
  );
  await tokenDepositController.createProof();
  await tokenDepositController.sign();
  await tokenDepositController.depositFundsToContractWithProofApproval(); // for ETH, returns txHash
  await tokenDepositController.awaitDepositFundsToContract();
  await tokenDepositController.send();
  // await tokenDepositController.awaitSettlement();
  return tokenDepositController;

}

export async function depositTokensToAztec(
  usersEthereumAddress: EthAddress,
  user: AccountId,
  token: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  provider: WalletProvider
) {
  const tokenAssetId = sdk.getAssetIdByAddress(token);
  // ^ can also use sdk.getAssetIdBySymbol('DAI');
  const signer = await sdk.createSchnorrSigner(
    provider.getPrivateKeyForAddress(usersEthereumAddress)!
  );
  const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue: AssetValue = {
    assetId: tokenAssetId,
    value: tokenQuantity,
  };
  const tokenDepositController = sdk.createDepositController(
    user,
    signer,
    tokenAssetValue,
    tokenDepositFee,
    usersEthereumAddress
  );
  await tokenDepositController.createProof();
  await tokenDepositController.sign();
  await tokenDepositController.approve();
  const txHash = await tokenDepositController.depositFundsToContract();
  await sdk.getTransactionReceipt(txHash);
  await tokenDepositController.send();
  // await tokenDepositController.awaitSettlement();
  return tokenDepositController;
}
