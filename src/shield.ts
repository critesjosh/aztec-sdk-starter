import {
  AccountId,
  AssetValue,
  AztecSdk,
  BridgeId,
  DefiSettlementTime,
  EthAddress,
  TxSettlementTime,
  WalletProvider,
  createAztecSdk,
  EthersAdapter
} from '@aztec/sdk';

const { JsonRpcProvider } = require("@ethersproject/providers");
const { ethers } = require("ethers");
const createDebug = require("debug");
const debug = createDebug("bb:demo");
require("dotenv").config();

let userId, sdk;

// const ETHEREUM_ADDRESS = EthAddress.fromString(
//   ethers.utils.computeAddress(process.env.ETHEREUM_PRIVATE_KEY)
// );
// const AZTEC_PRIVATE_KEY = Buffer.from(
//   process.env.AZTEC_PRIVATE_KEY,
//   "hex"
// );
// const ethersProvider = new JsonRpcProvider(process.env.ETHEREUM_HOST);
// const ethereumProvider = new EthersAdapter(ethersProvider);
// const walletProvider = new WalletProvider(ethereumProvider);
// walletProvider.addAccount(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex"));

// const shield = async (l1Depositor, aztecUser) => {
//   const shieldValue = sdk.toBaseUnits(0, "0.01");
//   const depositFees = await sdk.getDepositFees(shieldValue.assetId);
//   debug(
//     `shielding ${sdk.fromBaseUnits(
//       shieldValue,
//       true
//     )} from ${l1Depositor.toString()}...`
//   );

//   const signer = await sdk.createSchnorrSigner(AZTEC_PRIVATE_KEY);
//   // Last deposit pays for instant rollup to flush.
//   const fee = depositFees[TxSettlementTime.NEXT_ROLLUP];
//   const controller = sdk.createDepositController(
//     aztecUser.id,
//     signer,
//     shieldValue,
//     fee,
//     l1Depositor
//   );
//   await controller.createProof();
//   await controller.depositFundsToContractWithProofApproval(); // returns txHash
//   await controller.awaitDepositFundsToContract(); 
//   await controller.send(); //returns this.txIds[0]
//   await controller.awaitSettlement();
// };

// const main = async () => {
//   sdk = await createAztecSdk(walletProvider, {
//     serverUrl: process.env.ROLLUP_HOST,
//     pollInterval: 1000,
//     memoryDb: true,
//     minConfirmation: 1, // ETH block confirmations
//   });

//   await sdk.run();
//   await sdk.awaitSynchronised();
//   const user = await sdk.addUser(AZTEC_PRIVATE_KEY);
//   await shield(ETHEREUM_ADDRESS, user);

//   console.log("user", user);
//   console.log("done");
// };

// main();

export async function depositTokensToAztec(
  usersEthereumAddress: EthAddress,
  user: AccountId,
  token: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  provider: WalletProvider,
) {
  const tokenAssetId = sdk.getAssetIdBySymbol('ETH'); 
    // ^ can also use sdk.getAssetIdByAddress(token);
  const signer = await sdk.createSchnorrSigner(provider.getPrivateKeyForAddress(usersEthereumAddress)!);
  const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[settlementTime];
  const value = await sdk.isFeePayingAsset(tokenAssetId) ? tokenQuantity - tokenDepositFee.value : tokenQuantity;
  const tokenAssetValue = { assetId: tokenAssetId, value };
  const tokenDepositController = sdk.createDepositController(
    user,
    signer,
    tokenAssetValue,
    tokenDepositFee,
    usersEthereumAddress,
  );
  await tokenDepositController.createProof();
  await tokenDepositController.sign();
  await tokenDepositController.approve();
  const txHash = await tokenDepositController.depositFundsToContract();
  await sdk.getTransactionReceipt(txHash);
  await tokenDepositController.send();
  return tokenDepositController;
}
