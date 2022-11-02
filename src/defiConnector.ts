import {
  AztecSdk,
  AztecSdkUser,
  BridgeCallData,
  DefiSettlementTime,
  EthAddress,
  Signer,
  UserDefiTx,
} from "@aztec/sdk";

export async function ethConnector(
  user: AztecSdkUser,
  signer: Signer,
  connector: BridgeCallData,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: DefiSettlementTime,
  sdk: AztecSdk
): Promise<UserDefiTx[]> {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const tokenAssetValue = { assetId, value: tokenQuantity };
  const fee = (await sdk.getDefiFees(connector))[settlementTime];
  const controller = sdk.createDefiController(
    user.id,
    signer,
    connector,
    tokenAssetValue,
    fee
  );
  await controller.createProof();
  await controller.send();
  let defiTxs = await user.getDefiTxs()
  return defiTxs;
}
