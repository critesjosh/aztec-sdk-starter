import {
  AztecSdk,
  AztecSdkUser,
  createAztecSdk,
  EthersAdapter,
  EthAddress,
  EthereumProvider,
  GrumpkinAddress,
  RecoveryPayload,
  SchnorrSigner,
  TxSettlementTime,
  WalletProvider,
  SdkFlavour,
} from "@aztec/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { depositEthToAztec } from "./shieldAssets";
import { registerAccount } from "./registerAccount";
import { sendAsset } from "./transferNotes";
import { ethers } from "ethers";
import { randomBytes } from "crypto";
import { withdrawTokens } from "./withdrawNotes";
import { migrate } from "./migrateAccount";
import { recover } from "./recoverAccount";

require("dotenv").config();
const createDebug = require("debug");
const debug = createDebug("bb:demo");

const ethKeys = [
  process.env.ETHEREUM_PRIVATE_KEY_0,
  process.env.ETHEREUM_PRIVATE_KEY_1,
  process.env.ETHEREUM_PRIVATE_KEY_2,
];

const ethAddresses: EthAddress[] = ethKeys.map((key) => {
  return EthAddress.fromString(
    ethers.utils.computeAddress(Buffer.from(key, "hex"))
  );
});

const DAI_ADDRESS = EthAddress.fromString(process.env.DAI_ADDRESS);
const ETH_TOKEN_ADDRESS = EthAddress.ZERO;

const ethersProvider = new JsonRpcProvider(process.env.ETHEREUM_HOST);
const ethereumProvider: EthereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
ethKeys.forEach((key) => {
  walletProvider.addAccount(Buffer.from(key, "hex"));
});

// Account type just used in this script
type Account = {
  privacyAccountKeys: {
    privateKey: Buffer;
    publicKey: GrumpkinAddress;
  };
  spendingAccountKeys: {
    privateKey: Buffer;
    publicKey: GrumpkinAddress;
  };
  privacyAccount: AztecSdkUser;
  signer: SchnorrSigner;
};

let sdk: AztecSdk,
  accounts: Account[],
  recoveryPayloads: RecoveryPayload[],
  alias: string = "test";

const setupSdk = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: process.env.ROLLUP_HOST,
    pollInterval: 1000,
    memoryDb: true,
    debug: "bb:*",
    flavour: SdkFlavour.PLAIN, // Use PLAIN with Nodejs
    minConfirmation: 1, // ETH block confirmations
  });

  await sdk.run();
};

const tokenQuantity: bigint = ethers.utils.parseEther("0.01").toBigInt();

const createKeysAndInitUsers = async () => {
  // create Account and Spending keys for Ethereum accounts in .env
  accounts = await Promise.all(
    ethAddresses.map(async (address) => {
      let account = {
        privacyAccountKeys: null,
        spendingAccountKeys: null,
        privacyAccount: null,
        signer: null,
      };
      account.privacyAccountKeys = await sdk.generateAccountKeyPair(address);
      account.spendingAccountKeys = await sdk.generateSpendingKeyPair(address);
      return account;
    })
  );

  // add AztecSdkUsers and signers to local accounts object
  // spending keys must be registered on the network before they can be used
  await Promise.all(
    accounts.map(async (account) => {
      account.privacyAccount = await sdk.addUser(
        account.privacyAccountKeys.privateKey
      );
      account.signer = await sdk.createSchnorrSigner(
        account.spendingAccountKeys.privateKey
      );
      await account.privacyAccount.awaitSynchronised();
    })
  );

  await Promise.all(
    accounts.map(async (account, index) => {
      console.log(
        `account public key ${account.privacyAccount.id.toString()}`,
        `user${index} privacy Account ETH balance`,
        sdk.fromBaseUnits(
          await sdk.getBalance(
            account.privacyAccount.id,
            sdk.getAssetIdBySymbol("ETH")
          )
        ),
        `spendable balance: ${sdk.fromBaseUnits({
          assetId: 0,
          value: await sdk.getSpendableSum(account.privacyAccount.id, 0),
        })}
        `
      );
    })
  );

  // used when registering or migrating an account
  const thirdPartySigner = await sdk.createSchnorrSigner(randomBytes(32));
  const trustedThirdPartyPublicKey = thirdPartySigner.getPublicKey();
  recoveryPayloads = await sdk.generateAccountRecoveryData(
    accounts[0].privacyAccount.id,
    alias,
    [trustedThirdPartyPublicKey]
  );
};

// Deposit Ethereum assets to Aztec
async function depositAssets() {
  let txId = await depositEthToAztec(
    ethAddresses[0],
    accounts[0].privacyAccount.id,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log("deposit txId", txId.toString());
}

// Register a new spending key, alias, and optional recovery key
// includes an optional deposit
async function registerSigner() {
  let alias = "test";
  let recoveryPublicKey = recoveryPayloads[0].recoveryPublicKey;

  let txId = registerAccount(
    accounts[0].privacyAccount.id, // public key of the account to register for
    alias,
    accounts[0].privacyAccountKeys.privateKey, // private key used to register the signer
    accounts[0].signer.getPublicKey(), // public key of the new signer
    recoveryPublicKey, // public key of the recovery account
    ETH_TOKEN_ADDRESS, // used to get the ETH asset Id on Aztec
    tokenQuantity, // deposit amount
    TxSettlementTime.NEXT_ROLLUP, // cheaper but slower than TxSettlementTime.INSTANT
    ethAddresses[0], // depositor Ethereum account
    sdk
  );
  console.log("register txId", txId.toString());
}

// Transfer notes within Aztec
async function transferAssets() {
  let txId = await sendAsset(
    accounts[0].privacyAccount.id, // from
    accounts[1].privacyAccount.id, // to
    ETH_TOKEN_ADDRESS, // assetId
    tokenQuantity, // amount
    TxSettlementTime.NEXT_ROLLUP, // speed
    sdk,
    accounts[0].signer
  );

  console.log("transfer txId", txId.toString());
}

// Withdraw Aztec notes to Ethereum
async function withdrawAssets() {
  let txId = await withdrawTokens(
    accounts[0].privacyAccount.id,
    ethAddresses[0],
    ETH_TOKEN_ADDRESS,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    accounts[0].signer
  );

  console.log("withdraw txId", txId.toString());
}

// This function migrates your account so that your alias can be associated with new account keys and new spending keys
// this function can only be called once per account
async function migrateAccount() {
  let alias = "test";

  // These new keys that are generated should be done deterministically so that they can be derived again
  // or saved so that they are not lost.
  // These keys can be 32 random bytes.
  let newAccountPrivateKey = randomBytes(32);
  let newSpendingKey = await sdk.createSchnorrSigner(randomBytes(32));
  let newRecoveryKey = await sdk.createSchnorrSigner(randomBytes(32));

  let txId = await migrate(
    accounts[0].privacyAccount.id,
    accounts[0].signer,
    alias,
    newSpendingKey.getPublicKey(),
    newRecoveryKey.getPublicKey(),
    newAccountPrivateKey,
    ETH_TOKEN_ADDRESS,
    sdk
  );

  console.log("account migrated txId", txId.toString());
}

// Add the recovery public key to the list of spending keys.
// Pay the fee from an eth address.
// The RecoverAccountController wraps the DespoitController, so depositing assets at the same time is an option 
async function recoverAccount() {
  let txId = recover(
    recoveryPayloads,
    ETH_TOKEN_ADDRESS, // fee assest
    alias,             // alias of account to recover
    tokenQuantity,     // amount to deposit
    ETH_TOKEN_ADDRESS, // asset to deposit
    ethAddresses[0],   // Ethereum address to deposit from
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log('recovery txId', txId.toString())
}

async function main() {
  await setupSdk();
  await createKeysAndInitUsers();
  // await registerSigner();
  // await depositAssets();
  // await transferAssets();
  // await withdrawAssets();
  // await recoverAccount();
  // await migrateAccount();
}
main();
