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
  const [ethAccount, setEthAccount] = useState<EthAddress | null>(null);
  const [sdk, setSdk] = useState<null | AztecSdk>(null);
  const [account0, setAccount0] = useState<AztecSdkUser | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [accountPrivateKey, setAccountPrivateKey] = useState<Buffer | null>(null);
  const [accountPublicKey, setAccountPublicKey] = useState<GrumpkinAddress | null>(null);
  const [spendingSigner, setSpendingSigner] = useState<SchnorrSigner | undefined>(undefined);
  const [alias, setAlias] = useState("");
  const [amount, setAmount] = useState(0);

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
        setEthAccount(EthAddress.fromString(accounts[0]));


        const ethersProvider: Web3Provider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const ethereumProvider: EthereumProvider = new EthersAdapter(
          ethersProvider
        );

        const sdk = await createAztecSdk(ethereumProvider, {
          serverUrl: "https://api.aztec.network/aztec-connect-testnet/falafel", // goerli testnet
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
    const { publicKey: pubkey, privateKey } = await sdk!.generateAccountKeyPair(ethAccount!)
    console.log("privacy key", privateKey);
    console.log("public key", pubkey.toString());

    setAccountPrivateKey(privateKey);
    setAccountPublicKey(pubkey);
  }

  async function initUsersAndPrintBalances() {

    let account0 = (await sdk!.userExists(accountPublicKey!))
      ? await sdk!.getUser(accountPublicKey!)
      : await sdk!.addUser(accountPrivateKey!);

    setAccount0(account0!);

    if ((await sdk?.isAccountRegistered(accountPublicKey!)))
      setUserExists(true);

    await account0.awaitSynchronised();
    // Wait for the SDK to read & decrypt notes to get the latest balances
    console.log(
      "zkETH balance",
      sdk!.fromBaseUnits(
        await sdk!.getBalance(account0.id, sdk!.getAssetIdBySymbol("ETH"))
      )
    );
  }

  async function getSpendingKey() {
    const { privateKey } = await sdk!.generateSpendingKeyPair(ethAccount!);
    const signer = await sdk?.createSchnorrSigner(privateKey);
    console.log("signer added", signer);
    setSpendingSigner(signer);
  }

  async function registerNewAccount() {
    const depositTokenQuantity: bigint = ethers.utils
      .parseEther(amount.toString())
      .toBigInt();
    const recoverySigner = await sdk!.createSchnorrSigner(randomBytes(32));
    let recoverPublicKey = recoverySigner.getPublicKey();
    let txId = await registerAccount(
      accountPublicKey!,
      alias,
      accountPrivateKey!,
      spendingSigner!.getPublicKey(),
      recoverPublicKey,
      EthAddress.ZERO,
      depositTokenQuantity,
      TxSettlementTime.NEXT_ROLLUP,
      ethAccount!,
      sdk!
    );
    console.log("registration txId", txId);
    console.log(
      "lookup tx on explorer",
      `https://aztec-connect-testnet-explorer.aztec.network/goerli/tx/${txId.toString()}`
    );
  }

  async function depositEth() {
    const depositTokenQuantity: bigint = ethers.utils
      .parseEther(amount.toString())
      .toBigInt();

    let txId = await depositEthToAztec(
      ethAccount!,
      accountPublicKey!,
      depositTokenQuantity,
      TxSettlementTime.NEXT_ROLLUP,
      sdk!,
    );

    console.log("deposit txId", txId);
    console.log(
      "lookup tx on explorer",
      `https://aztec-connect-testnet-explorer.aztec.network/goerli/tx/${txId.toString()}`
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
          {accountPrivateKey ? (
            <button onClick={() => initUsersAndPrintBalances()}>
              Init User / Log Balance
            </button>
          ) : (
            <button onClick={() => login()}>Login</button>
          )}
          {spendingSigner && !userExists ? (
            <form>
              <label>
                Alias:
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
              </label>
            </form>
          ) : (
            ""
          )}
          {!spendingSigner && account0 ? (
            <button onClick={() => getSpendingKey()}>
              Create Spending Key (Signer)
            </button>
          ) : (
            ""
          )}
          {spendingSigner ? (
            <div>
              <form>
                <label>
                  Deposit Amount:
                  <input
                    type="number"
                    step="0.000000000000000001"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.valueAsNumber)}
                  />
                  ETH
                </label>
              </form>
              {!userExists ? (
                <button onClick={() => registerNewAccount()}>
                  Register Alias + Deposit ≥0.1 ETH
                </button>
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )}
          {spendingSigner && account0 ? (
            <button onClick={() => depositEth()}>Deposit ETH</button>
          ) : (
            ""
          )}
          <button onClick={() => console.log("sdk", sdk)}>Log SDK</button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default Home;
