import {
  AccountId,
  assetValueFromJson,
  AssetValue,
  AztecSdk,
  EthAddress,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
} from "@aztec/sdk";

export async function registerAccount(
  userId: GrumpkinAddress,
  alias: string,
  accountPrivateKey: Buffer,
  newSigner: SchnorrSigner,
  recoveryPublicKey: GrumpkinAddress,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  depositor: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const deposit = { assetId, value: tokenQuantity };
  const txFee = (await sdk.getRegisterFees(deposit))[settlementTime];

  const controller = await sdk.createRegisterController(
    userId,
    alias,
    accountPrivateKey,
    newSigner.getPublicKey(),
    recoveryPublicKey,
    deposit,
    txFee,
    depositor
    // optional feePayer requires an Aztec Signer to pay the fee
    );

  await controller.depositFundsToContract();
  await controller.awaitDepositFundsToContract();

  await controller.createProof();
  await controller.sign();
  await controller.send();
  return controller;
}
