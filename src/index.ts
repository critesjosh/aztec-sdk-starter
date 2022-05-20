import {
  AccountId,
  AztecSdk,
  BridgeId,
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
import { sendAsset } from "./transfer";
import { withdrawTokens } from "./withdraw";
import { bridgeToDefi } from "./defiBridge";
import { createPrivacyKey, createSpendingKey } from "./createAztecSigningKeys";
import { ethers } from "ethers";

require("dotenv").config();
const createDebug = require("debug");
const debug = createDebug("bb:demo");

const ETHEREUM_ADDRESS = EthAddress.fromString(
  ethers.utils.computeAddress(
    Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex")
  )
);

const DAI_ADDRESS = EthAddress.fromString(
  "0x6B175474E89094C44Da98b954EedeAC495271d0F"
);
const ETH_TOKEN_ADDRESS = EthAddress.ZERO;

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

  // Use the ethereum account from the WalletProvider to generate Aztec keys
  const { privateKey } = await createPrivacyKey(walletProvider, sdk);

  /*
    Setup the first Aztec account from the generated privacy key
  */

  // You can generate many Aztec AccountIds from the same private key
  const user0 = await sdk.addUser(privateKey, 0);
  const { privateKey: signingPrivateKey } = await createSpendingKey(
    walletProvider,
    sdk
  );
  const signer = await sdk.createSchnorrSigner(privateKey);
  // Wait for the SDK to read & decrypt notes to get the latest balances
  await user0.awaitSynchronised();
  console.log(
    "user0 ETH balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdBySymbol("ETH"), user0.id)
    )
  );
  console.log(
    "user0 DAI balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user0.id)
    )
  );

  /*
    Setup the second Aztec account
  */

  const user1 = await sdk.addUser(privateKey, 1);
  const signer1 = await sdk.createSchnorrSigner(signingPrivateKey);
  await user1.awaitSynchronised();
  console.log(
    "user1 ETH balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdBySymbol("ETH"), user1.id)
    )
  );
  console.log(
    "user1 DAI balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user1.id)
    )
  );

  const user2 = await sdk.addUser(privateKey, 2);
  await user2.awaitSynchronised();
  const signer2 = await sdk.createSchnorrSigner(signingPrivateKey);
  console.log(
    "user2 ETH balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdBySymbol("ETH"), user2.id)
    )
  );
  console.log(
    "user2 DAI balance",
    sdk.fromBaseUnits(
      await sdk.getBalanceAv(sdk.getAssetIdByAddress(DAI_ADDRESS), user2.id)
    )
  );

  /*
    Deposit assets to Aztec
  */

  const depositTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();

  // use TxSettlementTime.NEXT_ROLLUP for a cheaper, slower option than TxSettlementTime.INSTANT

  await depositEthToAztec(
    ETHEREUM_ADDRESS,
    user2.id,
    depositTokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    signer2
  );

  // await depositTokensToAztec(
  //   ETHEREUM_ADDRESS,
  //   user1.id,
  //   DAI_ADDRESS,
  //   depositTokenQuantity,
  //   TxSettlementTime.NEXT_ROLLUP,
  //   sdk,
  //   signer1
  // );

  /*
    Aztec Transfers
  */

  const transferTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();
  const aliasString = "joshc-test";
  const alias: AccountId = await sdk.getAccountId(
    aliasString,
    await getAliasNonce(aliasString)
  );

  await sendAsset(
    user0.id,
    user1.id,
    ETH_TOKEN_ADDRESS, // DAI_ADDRESS
    transferTokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    signer
  )

  /*
    Withdraw assets from Aztec
  */

  const withdrawTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();

  // withdrawTokens(
  //   user0.id,
  //   ETHEREUM_ADDRESS,
  //   ETH_TOKEN_ADDRESS,
  //   withdrawTokenQuantity,
  //   TxSettlementTime.NEXT_ROLLUP,
  //   sdk,
  //   signer
  // );

  /*
    Defi interaction from Aztec
  */
  const bridgeTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();
  const bridgeAddressId = 1;
  const ethAssetId = 0;
  const daiAssetId = 1;
  // const ethToDaiBridge = new BridgeId(bridgeAddressId, ethAssetId, daiAssetId);
  // const ethToDaiFees = await sdk.getDefiFees(ethToDaiBridge);

  // let defiTx = await bridgeToDefi(
  //   user0.id,
  //   signer,
  //   ethToDaiBridge,
  //   bridgeTokenQuantity,
  //   ethToDaiFees,
  //   sdk
  // );
  // console.log(defiTx)
};

main();

const formatAliasInput = (aliasInput: string) => aliasInput.toLowerCase();

const getAliasNonce = async (aliasInput: string) => {
  const alias = formatAliasInput(aliasInput);
  return sdk.getRemoteLatestAliasNonce(alias);
};
