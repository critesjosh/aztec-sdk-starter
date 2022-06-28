import {
  EthAddress,
  RecoveryPayload,
  AztecSdk,
  TxId,
  TxSettlementTime,
} from "@aztec/sdk";

export async function recover(
  recoveryPayloads: RecoveryPayload[],
  feeAsset: EthAddress,
  depositAmount: bigint,
  depositAsset: EthAddress,
  depositor: EthAddress,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk
): Promise<TxId> {
  const assetId = sdk.getAssetIdByAddress(depositAsset);
  const deposit = { assetId, value: depositAmount };
  const feeAssetId = sdk.getAssetIdByAddress(feeAsset);
  const tokenTransferFee = (await sdk.getRecoverAccountFees(feeAssetId))[
    settlementTime
  ];
  const controller = await sdk.createRecoverAccountController(
    recoveryPayloads[0],
    deposit,
    tokenTransferFee,
    depositor
  );
  await controller.createProof();

  await controller.depositFundsToContract();
  await controller.awaitDepositFundsToContract();
  await controller.sign();

  let txId = await controller.send();

  return txId;
}
