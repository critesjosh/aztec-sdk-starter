import {
  AztecSdk,
  AztecSdkUser,
  BridgeId,
  createAztecSdk,
  DefiSettlementTime,
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
import { addSpendingKeys } from "./addSpendingKeys";
import { bridgeToDefi } from "./defiBridge";
import { createLidoAdaptor } from "./defiAdaptors/lidoAdaptor";
import { createElementAdaptor } from "./defiAdaptors/elementAdaptor";
import { AZTEC_ASSETS } from "../../config"

require("dotenv").config();

const ETH_TOKEN_ADDRESS = EthAddress.ZERO;

const ethersProvider = new JsonRpcProvider(process.env.ETHEREUM_HOST);
const ethereumProvider: EthereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
walletProvider.addAccountsFromMnemonic(process.env.MNEMONIC, 2); // add as many accounts as you want, just make sure they're funded

type AccountKeys = {
  privateKey: Buffer;
  publicKey: GrumpkinAddress;
};

// Account type just used in this script
type Account = {
  privacyAccountKeys: AccountKeys;
  spendingAccountKeys: Array<AccountKeys>;
  privacyAccount: AztecSdkUser;
  signer: SchnorrSigner;
};

let sdk: AztecSdk,
  accounts: Account[],
  defaultAccountIndex: number = 0, // use this to easily switch Eth/Aztec account pair you are using
  recoveryPayloads: RecoveryPayload[],
  alias: string = "test62022-0",
  tokenQuantity: bigint = ethers.utils.parseEther("0.01").toBigInt();

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

const createKeysAndInitUsers = async () => {
  // create Account and Spending keys for Ethereum accounts in .env
  accounts = await Promise.all(
    walletProvider.getAccounts().map(async (address) => {
      let account = {
        privacyAccountKeys: null,
        spendingAccountKeys: [],
        privacyAccount: null,
        signer: null,
      };
      account.privacyAccountKeys = await sdk.generateAccountKeyPair(address);
      account.spendingAccountKeys.push(
        await sdk.generateSpendingKeyPair(address)
      );
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
        account.spendingAccountKeys[0].privateKey
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
          value: await sdk.getSpendableSum(account.privacyAccount.id, 0, true),
        })}
        `
      );
    })
  );

  // used when registering or migrating an account
  // this is a very insecure private key, just used for demo purposes
  const thirdPartySigner = await sdk.createSchnorrSigner(
    Buffer.alloc(32, 3, "hex")
  );
  const trustedThirdPartyPublicKey = thirdPartySigner.getPublicKey();
  recoveryPayloads = await sdk.generateAccountRecoveryData(
    accounts[defaultAccountIndex].privacyAccount.id,
    alias,
    [trustedThirdPartyPublicKey]
  );
};

// Deposit Ethereum assets to Aztec
async function depositAssets() {
  let txId = await depositEthToAztec(
    walletProvider.getAccounts()[defaultAccountIndex],
    accounts[defaultAccountIndex].privacyAccount.id,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log("deposit txId", txId.toString());
}

// Register a new spending key, alias, and optional recovery key
// includes an optional deposit
async function registerSigner() {
  let recoveryPublicKey = recoveryPayloads[0].recoveryPublicKey;

  let { controller, txId } = await registerAccount(
    accounts[defaultAccountIndex].privacyAccount.id, // public key of the account to register for
    alias,
    accounts[defaultAccountIndex].privacyAccountKeys.privateKey, // private key used to register the signer
    accounts[defaultAccountIndex].signer.getPublicKey(), // public key of the new signer
    recoveryPublicKey, // public key of the recovery account
    ETH_TOKEN_ADDRESS, // used to get the ETH asset Id on Aztec
    tokenQuantity, // deposit amount
    TxSettlementTime.NEXT_ROLLUP, // cheaper but slower than TxSettlementTime.INSTANT
    walletProvider.getAccounts()[defaultAccountIndex], // depositor Ethereum account
    sdk
  );
  console.log("register txId", txId.toString());

  await controller.awaitSettlement();
}

async function addSpendingKeysToAccount() {
  // these new signers can have any private key. These are simple to remember
  let newSigner1 = await sdk.createSchnorrSigner(Buffer.alloc(32, 1, "hex"));
  let newSigner2 = await sdk.createSchnorrSigner(Buffer.alloc(32, 2, "hex"));

  let txId = await addSpendingKeys(
    accounts[defaultAccountIndex].privacyAccount.id,
    accounts[defaultAccountIndex].signer,
    newSigner1.getPublicKey(),
    newSigner2.getPublicKey(),
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log("signers added", txId.toString());
}

// Transfer notes within Aztec
async function transferAssets() {
  let txId = await sendAsset(
    accounts[defaultAccountIndex].privacyAccount.id, // from
    accounts[1].privacyAccount.id, // to
    ETH_TOKEN_ADDRESS, // assetId
    tokenQuantity, // amount
    TxSettlementTime.NEXT_ROLLUP, // speed
    sdk,
    accounts[defaultAccountIndex].signer
  );

  console.log("transfer txId", txId.toString());
  console.log(await accounts[defaultAccountIndex].privacyAccount.getTxs());
}

// Withdraw Aztec notes to Ethereum
async function withdrawAssets() {
  let txId = await withdrawTokens(
    accounts[defaultAccountIndex].privacyAccount.id,
    walletProvider.getAccounts()[defaultAccountIndex],
    ETH_TOKEN_ADDRESS,
    tokenQuantity,
    TxSettlementTime.NEXT_ROLLUP,
    sdk,
    accounts[defaultAccountIndex].signer
  );

  console.log("withdraw txId", txId.toString());
}

// This function migrates your account so that your alias can be associated with new account keys and new spending keys
// this function can only be called once per account
async function migrateAccount() {
  // These new keys that are generated should be done deterministically so that they can be derived again
  // or saved so that they are not lost.
  // These keys can be 32 random bytes.
  let newAccountPrivateKey = randomBytes(32);
  let newSpendingKey = await sdk.createSchnorrSigner(randomBytes(32));
  let newRecoveryKey = await sdk.createSchnorrSigner(randomBytes(32));

  let txId = await migrate(
    accounts[defaultAccountIndex].privacyAccount.id,
    accounts[defaultAccountIndex].signer,
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
  if (
    (await sdk.isAccountRegistered(
      accounts[defaultAccountIndex].privacyAccount.id
    )) === false
  ) {
    throw new Error("account must be registered before it can be recovered");
  }

  let txId = await recover(
    recoveryPayloads,
    ETH_TOKEN_ADDRESS, // fee asset
    tokenQuantity, // amount to deposit
    ETH_TOKEN_ADDRESS, // asset to deposit
    walletProvider.getAccounts()[defaultAccountIndex], // Ethereum address to deposit from
    TxSettlementTime.NEXT_ROLLUP,
    sdk
  );

  console.log("recovery txId", txId.toString());
}

// This function will not work on the Goerli testnet
// All addresses and references are for an internal mainnet fork 
async function defiInteraction() {

  // find info about deployed bridge contract on mainnet here
  // https://github.com/AztecProtocol/aztec-connect-bridges

  const LidoId    = sdk.getBridgeAddressId(EthAddress.fromString("0x3C4711e5DE575aE19c9B09626EDC7Cb540027e36"))
  const ElementId = sdk.getBridgeAddressId(EthAddress.fromString("0xC116ecc074040AbEdB2E11A4e84dEcDBA141F38f"))

  const ethToWstEth = new BridgeId(LidoId, 0, 2); // IN: ETH (0), OUT: wstETH (2)
  const WstEthToEth = new BridgeId(LidoId, 2, 0); // IN: wstETH (2), OUT: ETH (0)

  const elementAdaptor = createElementAdaptor(
    ethereumProvider,
    "0x2266429abF6Ec8A1FC6712c2BbDc7262b40ba442",
    "0xC116ecc074040AbEdB2E11A4e84dEcDBA141F38f",
    false
  );
  // Element bridge auxData is the tranche expiry time
  // https://github.com/AztecProtocol/aztec-connect-bridges/blob/2f85d04e445eebd508b666bc1e29bcbc9955ebb0/src/bridges/element/ElementBridge.sol#L129
  let elementAuxData = await elementAdaptor.getAuxData(AZTEC_ASSETS[1], undefined, AZTEC_ASSETS[1], undefined)
  // The Element bridge uses auxData, the Lido/Curve bridges do not
  const elementBridge = new BridgeId(ElementId, 1, 1, undefined, undefined, Number(elementAuxData[0])); // IN: DAI (1), OUT: DAI (1)

  const wstEthTokenAddress = EthAddress.fromString("0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0")
  const daiTokenAddress    = EthAddress.fromString("0x6B175474E89094C44Da98b954EedeAC495271d0F")

  // this sends 2 txs on Aztec. 1 to the bridge account, 1 from the bridge account to the defi app
  let defiTxs = await bridgeToDefi(
    accounts[defaultAccountIndex].privacyAccount,
    accounts[defaultAccountIndex].signer,
    elementBridge,
    // ETH_TOKEN_ADDRESS,
    // wstEthTokenAddress,
    daiTokenAddress,
    tokenQuantity,
    DefiSettlementTime.DEADLINE,
    sdk
  );
  console.log("user defi transactions", defiTxs);
}

async function main() {
  await setupSdk();
  await createKeysAndInitUsers();
  // await registerSigner();
  // await addSpendingKeysToAccount();
  // await depositAssets();
  // await transferAssets();
  // await withdrawAssets();
  // await recoverAccount();
  // await migrateAccount();
  await defiInteraction();
}

main();
