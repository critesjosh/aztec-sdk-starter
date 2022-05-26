# Aztec SDK Reference script

SDK setup and examples are in `./src/index.ts`. Configured to work with Aztec on the Goerli testnet.

## Requirements

1. Node
2. Yarn
3. Goerli ETH. You can get some here. https://goerli-faucet.mudit.blog/

## Run

1. Install dependencies

```shell
yarn
```

2. Create your `.env` file and add your Ethereum private key with Goerli ETH.

3. Run script, `./src/index.ts`:

```shell
yarn go
```

## Environment

The script currently runs on a version of Aztec connected to the Goerli testnet.

You can check the status of the Aztec rollup provider at this url. https://api.aztec.network/aztec-connect-testnet/falafel/status

You can mint mock DAI on goerli by interacting with this contract `0x86166410b7a1a6d8b9df3660a978ea79aa1f30fd`. This encoded function call will mint you 10,000 mock DAI. `0x40c10f19000000000000000000000000302ce2faf4e3c75e8483456552dceab11205c3d600000000000000000000000000000000000000000000021e19e0c9bab2400000` just replace `302ce2faf4e3c75e8483456552dceab11205c3d6` with your Ethereum address. [Here](https://goerli.etherscan.io/tx/0x13201e94ed14db1584b1cbc6f98eea1be903fda24c110cd9d1603e667d3293bb) is an example tx.

## Contents

The `./src/index.ts` file contains a script that shows how to do many common operations on the Aztec network such as setting up the SDK, creating Aztec keys from an Ethereum private key, registering a new account, depositing transfering and withdrawing assets (Eth and tokens) and doing interactions with Ethereum L1 defi applications (like Lido and Element).

Defi interactions will not work on the Goerli testnet as the bridge contracts have not been deployed there. There is still an example of how to set up a defi interaction which will work on mainnet when Aztec Connect is launched.

## Building Intuition for Aztec Accounts

Accounts in Aztec work differently than accounts in Ethereum. There are two main parts to each Aztec account, the privacy account associated with nonce 0 and the spending account associated with nonce 1. Both of these accounts have the same public key and are differentiated by the nonce.

In [zk.money](https://zk.money), Aztec accounts are generated using Ethereum accounts by having the user sign a message and deriving the Aztec keys the signed message (see `src/aztecKeys.ts`). Different messages are used to generate different keys.

### Privacy Account

The privacy account is the account that is first generated using:

```ts
createPrivacyKey(provider: WalletProvider, sdk: AztecSdk): Promise<{
    privateKey: Buffer;
    publicKey: GrumpkinAddress;
}>
```

The private key that is returned can be used to decrypt notes for both the privacy account (nonce 0) and the spending account (nonce 1). The private key is used to spend notes associated with the privacy account and register a spending account. Typically the privacy account does not handle funds, it is used to create a spending account and decrypt notes. This reduces the risks of sharing the privacy key.

### Spending Account

Spending accounts are registered with a human-readable alias, a new spending key and a recovery key (see `src/registerAccount.ts`).

The spending account is typically the account where users will accept and send notes (this is how it is done in zk.money). The spending account has the same public key as the privacy account but is differentiated by the nonce. Notes associated with the spending account can be spent by the spending key defined during registration. If the spending key is lost, a recovery flow can be initiated by the recovery account specified when the spending account was registered.

The spending account is associated with a human-readable alias. The alias can be anything as long as it hasn't been claimed yet.

Registering an account has an associated fee as it includes a token deposit and is posting transactions to the network.

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```
