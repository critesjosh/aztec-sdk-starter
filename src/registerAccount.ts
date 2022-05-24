import {
  AccountId,
  AztecSdk,
  EthAddress,
  SchnorrSigner,
  TxSettlementTime,
} from "@aztec/sdk";

export async function registerAccount(
  user: AccountId,
  signer: SchnorrSigner,
  alias: string,
  newSigner: SchnorrSigner,
  recoveryPublicKey,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  depositer: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const tokenAssetValue = { assetId, value: tokenQuantity };
  const txFee = (await sdk.getRegisterFees(tokenAssetValue))[settlementTime];

  const controller = await sdk.createRegisterController(
    user,
    signer,
    alias,
    newSigner.getPublicKey(),
    recoveryPublicKey,
    tokenAssetValue,
    txFee,
    depositer
  );

  await controller.depositFundsToContract();
  await controller.awaitDepositFundsToContract();

  await controller.createProof();
  await controller.sign();
  await controller.send();
}
