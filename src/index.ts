import {
  AccountId,
  AztecSdk,
  createAztecSdk,
  WalletProvider,
  EthersAdapter,
  EthAddress,
  EthereumProvider,
  SchnorrSigner,
  TxSettlementTime,
} from "@aztec/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { depositTokensToAztec, depositEthToAztec } from "./shield";
import { sendETH, sendTokens } from "./transfer";
import { createPrivacyKey, createSpendingKey } from "./createSigningKeys";
import { ethers } from "ethers";

require("dotenv").config();
const createDebug = require("debug");
const debug = createDebug("bb:demo");

const ETHEREUM_ADDRESS = EthAddress.fromString(
  ethers.utils.computeAddress(
    Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex")
  )
);

const DAI_ADDRESS = EthAddress.fromString("0x6B175474E89094C44Da98b954EedeAC495271d0F");

const ethersProvider = new JsonRpcProvider(process.env.MAINNET_FORK_RPC);
const ethereumProvider: EthereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
walletProvider.addAccount(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex"));
let sdk: AztecSdk;

const main = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: process.env.MAINNET_FORK_ROLLUP,
    pollInterval: 1000,
    memoryDb: true,
    minConfirmation: 1, // ETH block confirmations
  });

  await sdk.run();
  await sdk.awaitSynchronised();

  // Use the ethereum account from the WalletProvider to generate Aztec spending keys
  const { privateKey } = await createPrivacyKey(walletProvider, sdk);

  // You can generate many Aztec AccountIds from the same private key
  const accountNonce = 1; 
  const user0 = await sdk.addUser(privateKey, 0);
  const user1 = await sdk.addUser(privateKey, 1);
  const user2 = await sdk.addUser(privateKey, 2);

  const { privateKey: signingPrivateKey } = await createSpendingKey(walletProvider, sdk);
  const signer: SchnorrSigner = await sdk.createSchnorrSigner(privateKey);
  const signer1 = await sdk.createSchnorrSigner(signingPrivateKey);  

  // Wait for the SDK to read & decrypt notes to get the latest balances
  await user0.awaitSynchronised();
  await user1.awaitSynchronised();
  await user2.awaitSynchronised();

  console.log('user0 ETH balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdBySymbol('ETH'), user0.id)))
  console.log('user0 DAI balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user0.id)))
  console.log('user1 ETH balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdBySymbol('ETH'), user1.id)))
  console.log('user1 DAI balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user1.id)))
  console.log('user2 ETH balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdBySymbol('ETH'), user2.id)))
  console.log('user2 DAI balance', sdk.fromBaseUnits(await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user2.id)))

  /*
  Deposit assets to Aztec
  */

  const depositTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();

  // use TxSettlementTime.NEXT_ROLLUP for a cheaper, slower option than TxSettlementTime.INSTANT
  const depositSettlementTime = TxSettlementTime.NEXT_ROLLUP;

  await depositEthToAztec(
    ETHEREUM_ADDRESS,
    user1.id,
    depositTokenQuantity,
    depositSettlementTime,
    sdk,
    signer1
  );

  // await depositTokensToAztec(
  //   ETHEREUM_ADDRESS,
  //   user0.id,
  //   DAI_ADDRESS,
  //   depositTokenQuantity,
  //   depositSettlementTime,
  //   sdk,
  //   signer
  // );

  /*
    Aztec Transfers
  */

  const transferTokenQuantity: bigint = ethers.utils.parseEther("0.01").toBigInt();
  const aliasString = "joshc-test"
  const alias: AccountId = await sdk.getAccountId(aliasString, await getAliasNonce(aliasString))

  // await sendETH(
  //   alias, // sender
  //   user0.id, // recipient
  //   transferTokenQuantity,
  //   TxSettlementTime.NEXT_ROLLUP,
  //   sdk,
  //   signer1
  // );

  // await sendTokens(
  //   user0.id,
  //   user1.id,
  //   DAI_ADDRESS,
  //   transferTokenQuantity,
  //   TxSettlementTime.NEXT_ROLLUP,
  //   sdk,
  //   signer1
  // )

};

main();

const formatAliasInput = (aliasInput: string) => aliasInput.toLowerCase();

const getAliasNonce = async (aliasInput: string) => {
  const alias = formatAliasInput(aliasInput);
  return sdk.getRemoteLatestAliasNonce(alias);
};

