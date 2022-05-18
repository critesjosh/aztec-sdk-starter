// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts
import { AccountId, AztecSdk, EthAddress, TxSettlementTime } from "@aztec/sdk";

export async function sendETH(
  sender: AccountId,
  recipient: AccountId,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk
) {
  const tokenAssetId = sdk.getAssetIdBySymbol("ETH"); // can also use sdk.getAssetIdByAddress(token);
  const senderSigner = await sdk.createSchnorrSigner(
    (
      await sdk.getUserData(sender)
    ).privateKey
  );
  const tokenTransferFee = (await sdk.getTransferFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue = { assetId: tokenAssetId, value: tokenQuantity };
  const tokenTransferController = sdk.createTransferController(
    sender,
    senderSigner,
    tokenAssetValue,
    tokenTransferFee,
    recipient
  );
  await tokenTransferController.createProof();
  await tokenTransferController.send();
  return tokenTransferController;
}

export async function sendTokens(
  sender: AccountId,
  recipient: AccountId,
  token: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk
) {
  const tokenAssetId = sdk.getAssetIdByAddress(token);
  const senderSigner = await sdk.createSchnorrSigner(
    (
      await sdk.getUserData(sender)
    ).privateKey
  );
  const tokenTransferFee = (await sdk.getTransferFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue = { assetId: tokenAssetId, value: tokenQuantity };
  const tokenTransferController = sdk.createTransferController(
    sender,
    senderSigner,
    tokenAssetValue,
    tokenTransferFee,
    recipient
  );
  await tokenTransferController.createProof();
  await tokenTransferController.send();
  return tokenTransferController;
}
