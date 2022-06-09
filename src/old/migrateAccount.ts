import {
  EthAddress,
  AztecSdk,
  AccountId,
  SchnorrSigner,
  GrumpkinAddress,
} from "@aztec/sdk";

export async function migrateAccount(
  user: AccountId,
  signer: SchnorrSigner,
  newSigningPublicKey: GrumpkinAddress,
  recoveryPublicKey: GrumpkinAddress,
  newAccountPrivateKey: Buffer,
  feeAsset: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(feeAsset);
  const [fee] = await sdk.getRecoverAccountFees(assetId);
  const controller = sdk.createMigrateAccountController(
    user,
    signer,
    newSigningPublicKey,
    recoveryPublicKey,
    newAccountPrivateKey,
    fee
  );
  await controller.createProof();
  await controller.send();
}
