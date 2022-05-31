import type { NextPage } from "next";
import { ethers } from "ethers";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useEffect, useState } from "react";
import {
  AccountId,
  AztecSdk,
  createAztecSdk,
  EthersAdapter,
  EthereumProvider,
  SdkFlavour,
  AztecSdkUser,
  GrumpkinAddress,
  SchnorrSigner,
  EthAddress,
  TxSettlementTime,
} from "@aztec/sdk";

import { randomBytes } from "crypto";

import {
  createPrivacyKey,
  createSpendingKey,
  DAI_ADDRESS,
  depositEthToAztec,
  registerAccount,
} from "./utils";

const Home: NextPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [hasMetamask, setHasMetamask] = useState(false);
  const [signer, setSigner] = useState<null | JsonRpcSigner>(null);
  const [ethereumProvider, setEthereumProvider] =
    useState<null | EthereumProvider>(null);
  const [ethAccount, setEthAccount] = useState<string | null>(null);
  const [sdk, setSdk] = useState<null | AztecSdk>(null);
  const [user0, setUser0] = useState<AztecSdkUser | null>(null);
  const [user1, setUser1] = useState<AztecSdkUser | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [privacyKey, setPrivacyKey] = useState<Buffer | null>(null);
  const [publicKey, setPublicKey] = useState<GrumpkinAddress | null>(null);
  const [signer1, setSigner1] = useState<SchnorrSigner | undefined>(undefined);
  const [signer0, setSigner0] = useState<SchnorrSigner | undefined>(undefined);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
    window.ethereum.on("accountsChanged", () => location.reload());
  });

  async function connect() {
    setConnecting(true);
    if (typeof window.ethereum !== "undefined") {
      try {
        let accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        setEthAccount(accounts[0]);

        const ethersProvider: Web3Provider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const ethereumProvider: EthereumProvider = new EthersAdapter(
          ethersProvider
        );

        const sdk = await createAztecSdk(ethereumProvider, {
          serverUrl: "https://api.aztec.network/aztec-connect-testnet/falafel", // goerli testnet
          // serverUrl: "https://aztec-connect-testnet-sdk.aztec.network",
          pollInterval: 1000,
          memoryDb: true,
          debug: "bb:*",
          flavour: SdkFlavour.PLAIN,
          minConfirmation: 1, // ETH block confirmations
        });

        await sdk.run();

        console.log("Aztec SDK initialized", sdk);
        setIsConnected(true);
        setSigner(ethersProvider.getSigner());
        setEthereumProvider(ethereumProvider);
        setSdk(sdk);
      } catch (e) {
        console.log(e);
      }
    } else {
      setIsConnected(false);
    }
    setConnecting(false);
  }

  async function login() {
    const { privateKey, publicKey: pubkey } = await createPrivacyKey(
      ethereumProvider!,
      sdk!
    );
    console.log("privacy key", privateKey);
    console.log("public key", pubkey);
    const signer = await sdk!.createSchnorrSigner(privateKey);
    setSigner0(signer);
    setPrivacyKey(privateKey);
    setPublicKey(pubkey);
  }

  async function initUsersAndPrintBalances() {
    const accountId = new AccountId(publicKey!, 0);
    let user0 = (await sdk!.userExists(accountId))
      ? await sdk!.getUser(accountId)
      : await sdk!.addUser(privacyKey!, 0);

    setUser0(user0!);
    await user0.awaitSynchronised();
    // Wait for the SDK to read & decrypt notes to get the latest balances
    console.log(
      "account 0 ETH balance",
      sdk!.fromBaseUnits(
        await sdk!.getBalanceAv(sdk!.getAssetIdBySymbol("ETH"), accountId)
      )
    );

    const accountId1 = new AccountId(publicKey!, 1);
    let user1 = (await sdk!.userExists(accountId1))
      ? await sdk!.getUser(accountId1)
      : await sdk!.addUser(privacyKey!, 1);

    if ((await user1.getUserData()).aliasHash !== undefined)
      setUserExists(true);

    setUser1(user1);
    await user1.awaitSynchronised();
    console.log(
      "account 1 ETH balance",
      sdk?.fromBaseUnits(
        await sdk.getBalanceAv(sdk.getAssetIdBySymbol("ETH"), user1.id)
      )
    );
  }

  async function getSpendingKey() {
    const { privateKey } = await createSpendingKey(ethereumProvider!, sdk!);
    const signer = await sdk?.createSchnorrSigner(privateKey);
    console.log("signer1 added", signer);
    setSigner1(signer);
  }

  async function registerNewAccount() {
    let alias = "test232";
    const depositTokenQuantity: bigint = ethers.utils
      .parseEther("0.01")
      .toBigInt();
    const recoverySigner = await sdk!.createSchnorrSigner(randomBytes(32));
    let recoverPublicKey = recoverySigner.getPublicKey();
    let controller = await registerAccount(
      user0!.id,
      signer0!,
      alias,
      signer1!,
      recoverPublicKey,
      EthAddress.ZERO,
      depositTokenQuantity,
      TxSettlementTime.NEXT_ROLLUP,
      EthAddress.fromString(ethAccount!),
      sdk!
    );
    console.log("registration controller", controller);
    console.log(
      "lookup tx on explorer",
      `https://aztec-connect-testnet-explorer.aztec.network/goerli/tx/${controller
        .getTxId()
        ?.toString()}`
    );
  }

  async function depositEth() {
    const depositTokenQuantity: bigint = ethers.utils
      .parseEther("0.01")
      .toBigInt();

    let controller = await depositEthToAztec(
      EthAddress.fromString(ethAccount!),
      user1!.id,
      depositTokenQuantity,
      TxSettlementTime.NEXT_ROLLUP,
      sdk!,
      signer1!
    );

    console.log("deposit tx controller", controller);
    console.log(
      "lookup tx on explorer",
      `https://aztec-connect-testnet-explorer.aztec.network/goerli/tx/${controller
        .getTxId()
        .toString()}`
    );
  }

  return (
    <div>
      {hasMetamask ? (
        isConnected ? (
          "Connected! "
        ) : (
          <button onClick={() => connect()}>Connect</button>
        )
      ) : (
        "Please install metamask"
      )}
      {connecting ? "Please wait, setting up Aztec" : ""}
      {sdk ? (
        <div>
          {privacyKey ? (
            <button onClick={() => initUsersAndPrintBalances()}>
              init users, log balances
            </button>
          ) : (
            <button onClick={() => login()}>Login</button>
          )}
          {signer1 && !userExists ? (
            <button onClick={() => registerNewAccount()}>
              Register new account
            </button>
          ) : (
            ""
          )}
          {!signer1 && user1 ? (
            <button onClick={() => getSpendingKey()}>
              Create Aztec Signer (for account 1)
            </button>
          ) : (
            ""
          )}
          {signer1 && user1 ? (
            <button onClick={() => depositEth()}>deposit .01 eth</button>
          ) : (
            ""
          )}
          <button onClick={() => console.log("sdk", sdk)}>log sdk</button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default Home;
