// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts

import { AccountId, AztecSdk, EthAddress, SchnorrSigner, TxSettlementTime } from "@aztec/sdk";

export async function withdrawTokens(
  user: AccountId,
  recipientEthereumAddress: EthAddress,
  token: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  signer: SchnorrSigner
) {
  const tokenAssetId = sdk.getAssetIdByAddress(token);
  const tokenWithdrawFee = (await sdk.getWithdrawFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue = { assetId: tokenAssetId, value: tokenQuantity };
  const tokenWithdrawController = sdk.createWithdrawController(
    user,
    signer,
    tokenAssetValue,
    tokenWithdrawFee,
    recipientEthereumAddress
  );
  await tokenWithdrawController.createProof();
  await tokenWithdrawController.send();
  return tokenWithdrawController;
}
