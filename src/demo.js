const {
  createAztecSdk,
  EthAddress,
  WalletProvider,
  EthersAdapter,
  TxSettlementTime,
} = require("@aztec/sdk");
const { ethers } = require("ethers");
const { JsonRpcProvider } = require("@ethersproject/providers");
const createDebug = require("debug");
const debug = createDebug("bb:demo");

require("dotenv").config();

const ROLLUP_HOST = process.env.ROLLUP_HOST;
const ETHEREUM_HOST = process.env.ETHEREUM_HOST;
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;

// This can be anything.
// Zk money derives this key for metamask users from a signed Ethereum message
const AZTEC_PRIVATE_KEY = Buffer.from(
  process.env.AZTEC_PRIVATE_KEY,
  "hex"
);

// const AZTEC_PRIVATE_KEY = randomBytes(32); // STORE THIS as hex
const ETHEREUM_ADDRESS = EthAddress.fromString(
  "0x302Ce2fAf4e3C75E8483456552dcEab11205C3d6"
);
console.log(ethers.utils.computeAddress(ETHEREUM_PRIVATE_KEY));


const ethersProvider = new JsonRpcProvider(ETHEREUM_HOST);
const ethereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
walletProvider.addAccount(ETHEREUM_PRIVATE_KEY);
let sdk;

const shield = async (l1Depositor, aztecUser) => {
  const shieldValue = sdk.toBaseUnits(0, "0.01");
  const depositFees = await sdk.getDepositFees(shieldValue.assetId);
  debug(
    `shielding ${sdk.fromBaseUnits(
      shieldValue,
      true
    )} from ${l1Depositor.toString()}...`
  );

  const signer = await sdk.createSchnorrSigner(AZTEC_PRIVATE_KEY);
  // Last deposit pays for instant rollup to flush.
  const fee = depositFees[TxSettlementTime.NEXT_ROLLUP];
  const controller = sdk.createDepositController(
    aztecUser.id,
    signer,
    shieldValue,
    fee,
    l1Depositor
  );
  await controller.createProof();
  await controller.depositFundsToContractWithProofApproval();
  await controller.awaitDepositFundsToContract();
  await controller.send();
  await controller.awaitSettlement();
};

const init = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: ROLLUP_HOST,
    pollInterval: 1000,
    memoryDb: true,
    minConfirmation: 1,
  });

  await sdk.run();
  await sdk.awaitSynchronised();
  const user = await sdk.addUser(AZTEC_PRIVATE_KEY);
  userId = user.id;

  await shield(ETHEREUM_ADDRESS, user);

  console.log("user", user);
  console.log("done");
};

init();
