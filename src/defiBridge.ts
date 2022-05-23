import {
    AccountId,
    AssetValue,
    AztecSdk,
    BridgeId,
    DefiSettlementTime,
    EthAddress,
    SchnorrSigner,
  } from "@aztec/sdk";

export async function bridgeToDefi(
    user: AccountId,
    signer: SchnorrSigner,
    bridge: BridgeId,
    tokenAddress: EthAddress,
    tokenQuantity: bigint,
    settlementTime: DefiSettlementTime,
    sdk: AztecSdk
){
    const assetId = sdk.getAssetIdByAddress(tokenAddress);
    const tokenAssetValue = { assetId, value: tokenQuantity };
    const fee = (await sdk.getDefiFees(bridge))[settlementTime];
    const controller = sdk.createDefiController(user, signer, bridge, tokenAssetValue, fee);
    await controller.createProof();
    await controller.send();
    return(await sdk.getDefiTxs(user));
}