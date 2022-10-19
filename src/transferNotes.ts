// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts
import {
  AztecSdk,
  EthAddress,
  GrumpkinAddress,
  Signer,
  TxId,
  TxSettlementTime,
} from "@aztec/sdk";

export async function sendAsset(
  sender: GrumpkinAddress,
  recipient: GrumpkinAddress,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  signer: Signer
): Promise<TxId> {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const tokenTransferFee = (await sdk.getTransferFees(assetId))[settlementTime];
  const tokenAssetValue = { assetId, value: tokenQuantity };

  const tokenTransferController = sdk.createTransferController(
    sender,
    signer,
    tokenAssetValue,
    tokenTransferFee,
    recipient
  );
  await tokenTransferController.createProof();
  let txId = await tokenTransferController.send();
  return txId;
}
