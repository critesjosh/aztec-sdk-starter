import {
  AssetValue,
  AztecSdk,
  EthAddress,
  GrumpkinAddress,
  Signer,
  TxId,
  TxSettlementTime,
} from "@aztec/sdk";

export async function addSpendingKeys(
  user: GrumpkinAddress,
  signer: Signer,
  alias: string,
  newSigner1: GrumpkinAddress,
  newSigner2: GrumpkinAddress,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk
): Promise<TxId> {
    // default to pay tx fee in ETH
  const fee = (await sdk.getAddSpendingKeyFees(sdk.getAssetIdBySymbol("ETH")))[
    settlementTime
  ];
  const controller = sdk.createAddSpendingKeyController(
    user,
    signer,
    alias,
    newSigner1,
    newSigner2,
    fee
  );
  await controller.createProof();
  let txId = await controller.send();
  return txId;
}
