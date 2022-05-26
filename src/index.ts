import {
  AccountId,
  AztecSdk,
  AztecSdkUser,
  BridgeId,
  createAztecSdk,
  DefiSettlementTime,
  EthersAdapter,
  EthAddress,
  EthereumProvider,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
  WalletProvider,
} from "@aztec/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { registerAccount } from "./registerAccount";
import { depositTokensToAztec, depositEthToAztec } from "./shield";
import { sendAsset } from "./transfer";
import { withdrawTokens } from "./withdraw";
import { bridgeToDefi } from "./defiBridge";
import { recoverAccount } from "./recoverAccount";
import { migrateAccount } from "./migrateAccount";
import {
  createPrivacyKey,
  createSpendingKey,
  createArbitraryDeterministicKey,
} from "./aztecKeys";
import { formatAliasInput, getAliasNonce } from "./utils";
import { ethers } from "ethers";
import { randomBytes } from "crypto";

require("dotenv").config();
const createDebug = require("debug");
const debug = createDebug("bb:demo");

const ETHEREUM_ADDRESS = EthAddress.fromString(
  ethers.utils.computeAddress(
    Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex")
  )
);

const ETHEREUM_ADDRESS_1 = EthAddress.fromString(
  ethers.utils.computeAddress(
    Buffer.from(process.env.ETHEREUM_PRIVATE_KEY_1, "hex")
  )
);

const DAI_ADDRESS = EthAddress.fromString(
  process.env.DAI_ADDRESS
);
const ETH_TOKEN_ADDRESS = EthAddress.ZERO;

const ethersProvider = new JsonRpcProvider(process.env.ETHEREUM_HOST);
const ethereumProvider: EthereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
walletProvider.addAccount(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex"));
// walletProvider.addAccount(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY_1, "hex"));
let sdk: AztecSdk,
  privateKey,
  publicKey: GrumpkinAddress,
  user0: AztecSdkUser,
  user1: AztecSdkUser,
  signer: SchnorrSigner,
  signer1: SchnorrSigner

const setupSdk = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: process.env.ROLLUP_HOST,
    pollInterval: 1000,
    memoryDb: true,
    minConfirmation: 1, // ETH block confirmations
  });

  await sdk.run();
  await sdk.awaitSynchronised();
};

const createKeysAndInitUsers = async () => {
  // Use the ethereum account from the WalletProvider to generate Aztec keys
  const keys = await createPrivacyKey(walletProvider, sdk);
  privateKey = keys.privateKey;
  publicKey = keys.publicKey;

/*
  Setup the first Aztec account from the generated privacy key
*/

  // You can generate many Aztec AccountIds from the same private key
  user0 = await sdk.addUser(privateKey, 0);
  const { privateKey: signingPrivateKey } = await createSpendingKey(
    walletProvider,
    sdk
  );
  signer = await sdk.createSchnorrSigner(privateKey);
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
  This account has already been registered on zk.money
*/

  user1 = await sdk.addUser(privateKey, 1);
  signer1 = await sdk.createSchnorrSigner(signingPrivateKey);
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
};

const createNewUser = async () => {
  /*
    Setup a new Aztec account
  */
  const { privateKey: signerKey } = await createArbitraryDeterministicKey(
    walletProvider,
    sdk,
    // process.env.ACCOUNT_2_MESSAGE
    `Sign this message to generate your Aztec Spending Key. This key lets the application spend your funds on Aztec.\n\nIMPORTANT: Only sign this message if you trust the application.`
  );
  const newSigner = await sdk.createSchnorrSigner(signerKey); // this can be anything. i am creating it deterministically from my ETH private key with a custom message, similar to how zk.money does it.
  const alias = "tester1"; // this is whatever you want
  const thirdPartySigner = await sdk.createSchnorrSigner(randomBytes(32)); // This can be anything as well. It is required data to recover an account
  const recoveryPayloads = await sdk.generateAccountRecoveryData(
    alias,
    publicKey,
    [
      // this public key is the public key associated with all of these accounts (user0, user1, user2, etc)
      thirdPartySigner.getPublicKey(),
    ]
  );
  const { recoveryPublicKey } = recoveryPayloads[0];
  const depositTokenQuantity: bigint = ethers.utils
    .parseEther("0.11")
    .toBigInt();

  await registerAccount(
    user0.id,
    signer,
    alias,
    newSigner,
    recoveryPublicKey,
    ETH_TOKEN_ADDRESS,
    depositTokenQuantity,
    TxSettlementTime.INSTANT,
    ETHEREUM_ADDRESS,
    sdk
  );

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
};

const depositAssets = async (isEth: boolean = true) => {
  const depositTokenQuantity: bigint = ethers.utils
    .parseEther("1.11")
    .toBigInt();

  // use TxSettlementTime.NEXT_ROLLUP for a cheaper, slower option than TxSettlementTime.INSTANT
  if (isEth) {
    await depositEthToAztec(
      ETHEREUM_ADDRESS,
      user1.id,
      depositTokenQuantity,
      TxSettlementTime.INSTANT,
      sdk,
      signer1
    );
  } else {
    await depositTokensToAztec(
      ETHEREUM_ADDRESS,
      user1.id,
      DAI_ADDRESS,
      depositTokenQuantity,
      TxSettlementTime.INSTANT,
      sdk,
      signer1
    );
  }
};

const transferAssets = async () => {
  const transferTokenQuantity: bigint = ethers.utils
    .parseEther("10.01")
    .toBigInt();
  // const aliasString = "joshc-test";
  // const alias: AccountId = await sdk.getAccountId(
  //   aliasString,
  //   await getAliasNonce(aliasString, sdk)
  // );

  await sendAsset(
    user0.id,
    user1.id,
    DAI_ADDRESS, // ETH_TOKEN_ADDRESS
    transferTokenQuantity,
    TxSettlementTime.INSTANT,
    sdk,
    signer
  );
};

const withdrawAssets = async () => {
  const withdrawTokenQuantity: bigint = ethers.utils
    .parseEther("0.01")
    .toBigInt();

  withdrawTokens(
    user0.id,
    ETHEREUM_ADDRESS,
    ETH_TOKEN_ADDRESS,
    withdrawTokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    signer
  );
};

const defiInteraction = async () => {
  const bridgeTokenQuantity: bigint = ethers.utils.parseEther("0.1").toBigInt();

  // retrieved from https://api.aztec.network/aztec-connect-dev/falafel/status
  const elementBridge = BridgeId.fromBigInt(
    40785495301437048271833175014331070913778870844156528143330443265n // IN: DAI (1), OUT: DAI (1)
  );
  const ethToWstEth = BridgeId.fromBigInt(9903520314283042199192993794n); // IN: ETH (0), OUT: wstETH (2)
  const WstEthToEth = BridgeId.fromBigInt(8589934594n); // IN: wstETH (2), OUT: ETH (0)
  // TODO: include info about how to find input assets
  // there are methods on the bridge to lookup asset inputs
  // sdk.getBridgeAddressId;

  // this sends 2 txs on Aztec. 1 to the bridge account, 1 from the bridge account to the defi app
  let defiTx = await bridgeToDefi(
    user1.id,
    signer1,
    ethToWstEth,
    ETH_TOKEN_ADDRESS,
    bridgeTokenQuantity,
    DefiSettlementTime.NEXT_ROLLUP,
    sdk
  );
  console.log(defiTx);
};

const getDefiTxs = async () => {
  let txs = await sdk.getDefiTxs(user1.id);
  console.log(txs);
};

const recover = async ()=>{

}

const migrate = async()=>{

}

async function main() {
  await setupSdk();
  await createKeysAndInitUsers();
  // await createNewUser();
  // await depositAssets(false); // set to true if depositing ETH
  // await transferAssets();
  // await withdrawAssets();
  // await defiInteraction();
  // await getDefiTxs();
  // await recover();
  // await migrate();
}
main();
