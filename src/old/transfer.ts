// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts
import { AccountId, AztecSdk, EthAddress, SchnorrSigner, TxSettlementTime } from "@aztec/sdk";

export async function sendAsset(
  sender: AccountId,
  recipient: AccountId,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  signer: SchnorrSigner
) {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const tokenTransferFee = (await sdk.getTransferFees(assetId))[
    settlementTime
  ];
  const tokenAssetValue = { assetId, value: tokenQuantity };
  const tokenTransferController = sdk.createTransferController(
    sender,
    signer,
    tokenAssetValue,
    tokenTransferFee,
    recipient
  );
  await tokenTransferController.createProof();
  await tokenTransferController.send();
  return tokenTransferController;
}
