import {
  AccountId,
  AssetValue,
  AztecSdk,
  EthAddress,
  EthereumProvider,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
  WalletProvider,
  Web3Signer,
} from "@aztec/sdk";
import { Web3Provider } from "@ethersproject/providers";

export const DAI_ADDRESS = EthAddress.fromString(
  "0x86166410B7A1a6D8B9DF3660a978eA79Aa1F30FD"
); // goerli

const privateKeyMessage = Buffer.from(
  `Sign this message to generate your Aztec Privacy Key. This key lets the application decrypt your balance on Aztec.\n\nIMPORTANT: Only sign this message if you trust the application.`
);

const spendingKeyMessage = Buffer.from(
  `Sign this message to generate your Aztec Spending Key. This key lets the application spend your funds on Aztec.\n\nIMPORTANT: Only sign this message if you trust the application.`
);

export async function createSpendingKey(
  provider: EthereumProvider,
  sdk: AztecSdk
) {
  const privateKey = await createSigningKey(provider, spendingKeyMessage);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function createPrivacyKey(
  provider: EthereumProvider,
  sdk: AztecSdk
) {
  const privateKey = await createSigningKey(provider, privateKeyMessage);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function createArbitraryDeterministicKey(
  provider: EthereumProvider,
  sdk: AztecSdk,
  message: string
) {
  const messageToSign = Buffer.from(message);
  const privateKey = await createSigningKey(provider, messageToSign);
  const publicKey = await sdk.derivePublicKey(privateKey);
  return { privateKey, publicKey };
}

const createSigningKey = async (
  provider: EthereumProvider,
  message: Buffer
) => {
  const signer = new Web3Signer(provider);
  const ethAddress = (await provider.request({ method: "eth_accounts" }))[0];
  const signedMessage = await signer.signMessage(message, ethAddress);
  return signedMessage.slice(0, 32);
};

export async function depositEthToAztec(
  usersEthereumAddress: EthAddress,
  user: AccountId,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  signer: SchnorrSigner
) {
  const tokenAssetId = sdk.getAssetIdBySymbol("ETH");
  const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue: AssetValue = {
    assetId: tokenAssetId,
    value: tokenQuantity,
  };
  const tokenDepositController = sdk.createDepositController(
    user,
    signer,
    tokenAssetValue,
    tokenDepositFee,
    usersEthereumAddress
  );
  await tokenDepositController.createProof();
  await tokenDepositController.sign();
  await tokenDepositController.depositFundsToContractWithProofApproval(); // for ETH, returns txHash
  await tokenDepositController.awaitDepositFundsToContract();
  await tokenDepositController.send();
  // await tokenDepositController.awaitSettlement();
  return tokenDepositController;
}

export async function depositTokensToAztec(
  usersEthereumAddress: EthAddress,
  user: AccountId,
  token: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  sdk: AztecSdk,
  signer: SchnorrSigner
) {
  const tokenAssetId = sdk.getAssetIdByAddress(token);
  // ^ can also use sdk.getAssetIdBySymbol('DAI');
  const tokenDepositFee = (await sdk.getDepositFees(tokenAssetId))[
    settlementTime
  ];
  const tokenAssetValue: AssetValue = {
    assetId: tokenAssetId,
    value: tokenQuantity,
  };
  const tokenDepositController = sdk.createDepositController(
    user,
    signer,
    tokenAssetValue,
    tokenDepositFee,
    usersEthereumAddress
  );
  await tokenDepositController.createProof();
  await tokenDepositController.sign();
  await tokenDepositController.approve();
  const txHash = await tokenDepositController.depositFundsToContract();
  await sdk.getTransactionReceipt(txHash);
  await tokenDepositController.send();
  // await tokenDepositController.awaitSettlement();
  return tokenDepositController;
}

export async function registerAccount(
  user: AccountId,
  signer: SchnorrSigner,
  alias: string,
  newSigner: SchnorrSigner,
  recoveryPublicKey: GrumpkinAddress,
  tokenAddress: EthAddress,
  tokenQuantity: bigint,
  settlementTime: TxSettlementTime,
  depositer: EthAddress,
  sdk: AztecSdk
) {
  const assetId = sdk.getAssetIdByAddress(tokenAddress);
  const deposit = { assetId, value: tokenQuantity };
  const txFee = (await sdk.getRegisterFees(deposit))[settlementTime];

  const controller = await sdk.createRegisterController(
    user,
    signer,
    alias,
    newSigner.getPublicKey(),
    recoveryPublicKey,
    deposit,
    txFee,
    depositer
  );

  await controller.depositFundsToContract();
  await controller.awaitDepositFundsToContract();

  await controller.createProof();
  await controller.sign();
  await controller.send();
  return controller;
}
