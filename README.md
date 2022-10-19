Learn more about the SDK on the Aztec documentation site [here](https://docs.aztec.network/sdk/overview).

# Aztec SDK Reference script

SDK setup and examples are in `./src/latest/index.ts`. Configured to work with Aztec on a mainnet fork testnet. 


## Requirements

1. Node
2. Yarn
3. mainnet fork ETH. Use the faucet here. https://aztec-connect-testnet-faucet.aztec.network/

## Run

1. Install dependencies

```shell
yarn
```

When you asked for which version of `aztec/bridge-clients` to use, pick the highest version number.

1. Create your `.env` file and add your Ethereum private key or mnemonic

2. Run script, `./src/index.ts`:

```shell
yarn go
```

At the bottom of `./src/index.ts` is a function named `main` where you can turn the functions in the script on and off.

## Environment

The script currently runs on a version of Aztec connected to a mainnet fork testnet.

The rollup processor endpoint for the testnet is:

```
https://api.aztec.network/aztec-connect-testnet/falafel
```

and for Ethereum mainnet is:

```
https://api.aztec.network/aztec-connect-prod/falafel
```

The `.env.example` file contains these endpoints as well.

You can check the status of the Aztec rollup provider at this url. https://api.aztec.network/aztec-connect-testnet/falafel/status and check the testnet block explorer here: https://aztec-connect-testnet-explorer.aztec.network/

It may also be helpful to cross reference data and transaction histories with the testnet version of zk.money. https://aztec-connect-testnet.zk.money/

## Contents

The `./src/index.ts` file contains a script that shows how to do many common operations on the Aztec network such as setting up the SDK, creating Aztec keys from an Ethereum private key, registering a new account, depositing transferring and withdrawing assets (Eth and tokens). Examples of interactions with Ethereum L1 defi applications (like Lido and Element) are coming soon.

### Demo web app

See `./web-app` for an example Next.js application.

## Building Intuition for Aztec Accounts

[The accounts page of the Aztec docs](https://docs.aztec.network/how-aztec-works/accounts) has the most up to date and comprehensive information on accounts.

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```

When debugging in the browser, make sure the dev tools console logging is set to verbose.

Debugging applications in privacy preserving systems like Aztec is difficult--you can't reference the block explorer to verify all transaction and account information. I like to use the [testnet version of zk.money](https://aztec-connect-testnet.zk.money/) to cross reference account and transaction information.

We are in the process of building out better developer tooling in this regard (ie import your privacy key into the block explorer to decrypt your account and transaction histories). If you would like to help build developer tooling for Aztec, reach out to me on twitter [@critesjosh_](https://twitter.com/critesjosh_).
