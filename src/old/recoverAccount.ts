import { EthAddress, RecoveryPayload, AztecSdk, TxSettlementTime } from '@aztec/sdk'

export async function recoverAccount(
    recoveryPayloads: RecoveryPayload[],
    feeAsset: EthAddress,
    // settlementTime: TxSettlementTime,
    sdk: AztecSdk
  ) {
    const assetId = sdk.getAssetIdByAddress(feeAsset);
    // const tokenTransferFee = (await sdk.getTransferFees(assetId))[
    //   settlementTime
    // ];
    const [fee] = await sdk.getRecoverAccountFees(assetId);
    const controller = sdk.createRecoverAccountController(recoveryPayloads[0], fee);
    await controller.createProof();
    await controller.send();
}