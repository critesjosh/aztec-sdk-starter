import {
  AztecSdk,
  EthAddress,
  GrumpkinAddress,
  RegisterController,
  TxId,
  TxSettlementTime,
} from "@aztec/sdk";

export async function registerAccount(
  userId: GrumpkinAddress,
  alias: string,
  accountPrivateKey: Buffer,
  newSigner: GrumpkinAddress,
  recoveryPublicKey: GrumpkinAddress,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  depositor: EthAddress,
  sdk: AztecSdk
): Promise<{ controller: RegisterController; txId: TxId }> {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const deposit = { assetId, value: tokenQuantity };
  const txFee = (await sdk.getRegisterFees(deposit))[settlementTime];

  const controller = await sdk.createRegisterController(
    userId,
    alias,
    accountPrivateKey,
    newSigner,
    recoveryPublicKey,
    deposit,
    txFee,
    depositor
    // optional feePayer requires an Aztec Signer to pay the fee
  );

  if ((await controller.getPendingFunds()) < tokenQuantity) {
    await controller.depositFundsToContract();
    await controller.awaitDepositFundsToContract();
  }

  await controller.createProof();
  await controller.sign();
  let txId = await controller.send();
  return { controller, txId };
}
