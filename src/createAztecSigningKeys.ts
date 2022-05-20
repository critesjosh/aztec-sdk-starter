import { AztecSdk, EthAddress, WalletProvider, Web3Signer } from "@aztec/sdk";

const privateKeyMessage = Buffer.from(
  `Sign this message to generate your Aztec Privacy Key. This key lets the application decrypt your balance on Aztec.\n\nIMPORTANT: Only sign this message if you trust the application.`
);

const spendingKeyMessage = Buffer.from(
  `Sign this message to generate your Aztec Spending Key. This key lets the application spend your funds on Aztec.\n\nIMPORTANT: Only sign this message if you trust the application.`
);

export async function createSpendingKey(
  provider: WalletProvider,
  sdk: AztecSdk
) {
  const privateKey = await createSigningKey(provider, spendingKeyMessage);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function createPrivacyKey(
  provider: WalletProvider,
  sdk: AztecSdk
) {
  const privateKey = await createSigningKey(provider, privateKeyMessage);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function createArbitraryDeterministicKey(
  provider: WalletProvider,
  sdk: AztecSdk,
  message: string
) {
  const messageToSign = Buffer.from(message);
  const privateKey = await createSigningKey(provider, messageToSign);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

const createSigningKey = async (provider: WalletProvider, message: Buffer) => {
  const signer = new Web3Signer(provider);
  const ethAddress = provider.getAccount(0);
  const signedMessage = await signer.signMessage(message, ethAddress);
  return signedMessage.slice(0, 32);
};
