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

3. Run script, `./src/sdk_2.1.5/index.ts`:

```shell
yarn go
```

## Environment

The script currently runs on a version of Aztec connected to the Goerli testnet.

You can check the status of the Aztec rollup provider at this url. https://api.aztec.network/aztec-connect-testnet/falafel/status and check the testnet block explorer here: https://aztec-connect-testnet-explorer.aztec.network/

**This DAI isnt currently working on goerli**

~~You can mint mock DAI on goerli by interacting with this contract `0x86166410b7a1a6d8b9df3660a978ea79aa1f30fd`. This encoded function call will mint you 10,000 mock DAI. `0x40c10f19000000000000000000000000302ce2faf4e3c75e8483456552dceab11205c3d600000000000000000000000000000000000000000000021e19e0c9bab2400000` just replace `302ce2faf4e3c75e8483456552dceab11205c3d6` with your Ethereum address. [Here](https://goerli.etherscan.io/tx/0x13201e94ed14db1584b1cbc6f98eea1be903fda24c110cd9d1603e667d3293bb) is an example tx.~~

## Contents

The `./src/sdk_2.1.5/index.ts` file contains a script that shows how to do many common operations on the Aztec network such as setting up the SDK, creating Aztec keys from an Ethereum private key, registering a new account, depositing transfering and withdrawing assets (Eth and tokens). Examples of interactions with Ethereum L1 defi applications (like Lido and Element) are coming soon. Defi interactions will not work on the Goerli testnet as the bridge contracts have not been deployed there.

### Demo web app (WIP)

See `./web-app` for an example Next.js application. This is using an older version of the SDK and needs to be updated.

## Building Intuition for Aztec Accounts

Accounts in Aztec work differently than accounts in Ethereum. There are two main parts to each Aztec account, an account and the associated signer (spending key). The private keys for each can be different, but don't have to be. The private key associated with the account is used to decrypt asset notes and used to register a distinct spending key. It is a best practice to register a new signer when an account is created to create separation between the decryption key and the spending key.

In [zk.money](https://zk.money), Aztec accounts are generated using Ethereum accounts by having the user sign a message and deriving the Aztec keys the signed message (see `src/aztecKeys.ts`). Different messages are used to generate different keys.

### Signer (spending key)

If the spending key is lost, a recovery flow can be initiated by the recovery account specified when the spending account was registered.

The account signer is registered with a human-readable alias. The alias can be anything as long as it hasn't been claimed yet.

Registering an account has an associated fee as it includes a token (or ETH) deposit and is posting transactions to the network.

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```

When debugging in the browser, make sure the dev tools console logging is set to verbose.

Debugging applications in privacy preserving systems like Aztec is difficult--you can't reference the block explorer to verify all transaction and account information. I like to use the [testnet version of zk.money](https://aztec-connect-testnet.zk.money/) to cross reference account and transaction information.

We are in the process of building out better developer tooling in this regard (ie import your privacy key into the block explorer to decrypt your account and transaction histories). If you would like to help build developer tooling for Aztec, reach out to me on twitter [@critesjosh_](https://twitter.com/critesjosh_).
