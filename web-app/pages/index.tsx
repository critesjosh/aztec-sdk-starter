import type { NextPage } from "next";
import { ethers } from "ethers";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useEffect, useState } from "react";
import {
  AztecSdk,
  createAztecSdk,
  EthersAdapter,
  EthereumProvider,
  SdkFlavour
} from "@aztec/sdk";

const Home: NextPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasMetamask, setHasMetamask] = useState(false);
  const [signer, setSigner] = useState<null | JsonRpcSigner>(null);
  const [sdk, setSdk] = useState<null|AztecSdk>(null);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  });

  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
        setIsConnected(true);
        const ethersProvider: Web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setSigner(ethersProvider.getSigner());

        console.log('ethers provider', ethersProvider)
        const ethereumProvider: EthereumProvider = new EthersAdapter(ethersProvider);
        // const walletProvider = new WalletProvider(ethereumProvider);

        console.log('wallet provider', ethereumProvider)
        const sdk = await createAztecSdk(ethereumProvider, {
          serverUrl: 'https://api.aztec.network/aztec-connect-testnet/falafel', // goerli testnet
          pollInterval: 1000,
          memoryDb: true,
          debug: 'zm:*,bb:*',
          flavour: SdkFlavour.HOSTED,
          minConfirmation: 1, // ETH block confirmations
        });

        console.log(sdk)
        
        setSdk(sdk)
        await sdk.run();
        await sdk.awaitSynchronised();
        console.log(sdk)
      } catch (e) {
        console.log(e);
      }
    } else {
      setIsConnected(false);
    }
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

      {isConnected ? <button onClick={() => console.log(sdk)}>Click</button> : ""}
    </div>
  );
};

export default Home;
