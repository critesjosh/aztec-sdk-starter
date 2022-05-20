import {
    AccountId,
    AztecSdk,
    BridgeId,
    SchnorrSigner,
  } from "@aztec/sdk";


export async function bridgeToDefi(
    user: AccountId,
    signer: SchnorrSigner,
    bridge: BridgeId,
    depositValue,
    fee,
    sdk: AztecSdk
){

    const controller = sdk.createDefiController(user, signer, bridge, depositValue, fee);
    await controller.createProof();
    await controller.send();
    return(await sdk.getDefiTxs(user));
}