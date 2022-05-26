import {
  AccountId,
  AztecSdk,
  EthAddress,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
} from "@aztec/sdk";

export async function registerAccount(
  user: AccountId,
  signer: SchnorrSigner,
  alias: string,
  newSigner: SchnorrSigner,
  recoveryPublicKey: GrumpkinAddress,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  depositer: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const deposit = { assetId, value: tokenQuantity };
  const txFee = (await sdk.getRegisterFees(deposit))[settlementTime];

  const controller = await sdk.createRegisterController(
    user,
    signer,
    alias,
    newSigner.getPublicKey(),
    recoveryPublicKey,
    deposit,
    txFee,
    depositer
  );

  await controller.depositFundsToContract();
  await controller.awaitDepositFundsToContract();

  await controller.createProof();
  await controller.sign();
  await controller.send();
}
