import {
  AccountId,
  EthAddress,
  AztecSdk,
  SchnorrSigner,
  GrumpkinAddress,
} from "@aztec/sdk";

export async function recoverAccount(
  user: AccountId,
  signer: SchnorrSigner,
  newSignerPublicKey1: GrumpkinAddress,
  newSignerPublicKey2: GrumpkinAddress,
  feeAsset: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(feeAsset);
  const [fee] = await sdk.getAddSigningKeyFees(assetId);
  const controller = sdk.createAddSigningKeyController(
    user,
    signer,
    newSignerPublicKey1,
    newSignerPublicKey2,
    fee
  );
  await controller.createProof();
  await controller.send();
}
