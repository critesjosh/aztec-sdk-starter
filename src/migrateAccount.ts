import {
  AssetValue,
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
    const deposit: AssetValue = {assetId: 0, value: BigInt(0)};
    const controller = sdk.createMigrateAccountController(
      user,
      signer,
      newAccountPrivateKey,
      newSpendingPublicKey,
      recoveryPublicKey,
      deposit,
      fee
    );
    await controller.createProof();
    let txId = await controller.send();
    return txId;
  }
  