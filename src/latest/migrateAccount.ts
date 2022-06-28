import {
    EthAddress,
    AztecSdk,
    Signer,
    GrumpkinAddress,
    TxId,
  } from "@aztec/sdk";
  
  export async function migrate(
    user: GrumpkinAddress,
    signer: Signer,
    newSpendingPublicKey: GrumpkinAddress,
    recoveryPublicKey: GrumpkinAddress,
    newAccountPrivateKey: Buffer,
    feeAsset: EthAddress,
    sdk: AztecSdk
  ) : Promise<TxId> {
    const assetId = sdk.getAssetIdByAddress(feeAsset);
    const [fee] = await sdk.getRecoverAccountFees(assetId);
    const controller = sdk.createMigrateAccountController(
      user,
      signer,
      newAccountPrivateKey,
      newSpendingPublicKey,
      recoveryPublicKey,
      fee
    );
    await controller.createProof();
    let txId = await controller.send();
    return txId;
  }
  