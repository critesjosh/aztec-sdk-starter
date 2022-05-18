import {
  createAztecSdk,
  WalletProvider,
  EthersAdapter,
  EthAddress,
  TxSettlementTime
} from "@aztec/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { depositTokensToAztec, depositEthToAztec } from "./shield";
import { ethers } from "ethers";

require("dotenv").config();
const createDebug = require("debug");
const debug = createDebug("bb:demo");


const ETHEREUM_ADDRESS = EthAddress.fromString(
  ethers.utils.computeAddress(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex"))
);

const AZTEC_PRIVATE_KEY = Buffer.from(process.env.AZTEC_PRIVATE_KEY, "hex");

const ethersProvider = new JsonRpcProvider(process.env.ETHEREUM_HOST);
const ethereumProvider = new EthersAdapter(ethersProvider);
const walletProvider = new WalletProvider(ethereumProvider);
walletProvider.addAccount(Buffer.from(process.env.ETHEREUM_PRIVATE_KEY, "hex"));
let sdk;

const main = async () => {
  sdk = await createAztecSdk(walletProvider, {
    serverUrl: process.env.ROLLUP_HOST,
    pollInterval: 1000,
    memoryDb: true,
    minConfirmation: 1, // ETH block confirmations
  });

  await sdk.run();
  await sdk.awaitSynchronised();
  const user = await sdk.addUser(AZTEC_PRIVATE_KEY);

  const depositTokenQuantity: bigint = ethers.utils.parseEther("0.01").toBigInt();
  // sdk.toBaseUnits(0, "0.01"); // 0.01 ETH
  

  // Last deposit pays for instant rollup to flush.
  const depositSettlementTime = TxSettlementTime.NEXT_ROLLUP;
  // const depositTokenAddress = EthAddress.ZERO // ETH

  await depositEthToAztec(
    ETHEREUM_ADDRESS,
    user.id,
    depositTokenQuantity,
    depositSettlementTime,
    sdk,
    walletProvider
  );
};

main();
