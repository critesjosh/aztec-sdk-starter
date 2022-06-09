import {
  AztecSdk,
  AztecSdkUser,
  createAztecSdk,
  EthersAdapter,
  EthAddress,
  EthereumProvider,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
  WalletProvider,
  SdkFlavour,
} from "@aztec/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { depositEthToAztec } from "./shield";
import { registerAccount } from "./registerAccount";
import { sendAsset } from "./transfer";
import { ethers } from "ethers";
import { randomBytes } from "crypto";

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
  privacyAccounts: AztecSdkUser[],
  signers: SchnorrSigner[];

const setupSdk = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: process.env.ROLLUP_HOST,
    pollInterval: 1000,
    memoryDb: true,
    debug: "bb:*",
    flavour: SdkFlavour.PLAIN,
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

  // log
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
};

async function depositAssets() {
  let controller = await depositEthToAztec(
    ethAddresses[0],
    accounts[0].privacyAccount.id,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log(controller);
}

async function registerSigner() {
  registerAccount(
    accounts[0].privacyAccount.id,
    "test2",
    accounts[0].privacyAccountKeys.privateKey,
    signers[0],
    undefined,
    ETH_TOKEN_ADDRESS,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    ethAddresses[0],
    sdk
  );
}

async function transferAssets() {
  await sendAsset(
    accounts[0].privacyAccount.id,
    accounts[1].privacyAccount.id,
    ETH_TOKEN_ADDRESS,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    accounts[0].signer
  );
}

async function main() {
  await setupSdk();
  await createKeysAndInitUsers();
  // await registerSigner();
  // await depositAssets(); // set to true if depositing ETH
  // await transferAssets();
  // await withdrawAssets();
  // await defiInteraction();
  // await getDefiTxs();
  // await recover();
  // await migrate();
}
main();
