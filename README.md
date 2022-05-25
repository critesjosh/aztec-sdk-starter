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

## Contents

The `./src/index.ts` file contains a script that shows how to do many common operations on the Aztec network such as setting up the SDK, creating Aztec keys from an Ethereum private key, registering a new account, depositing transfering and withdrawing assets (Eth and tokens) and doing interactions with Ethereum L1 defi applications (like Lido and Element).

Defi interactions will not work on the Goerli testnet as the bridge contracts have not been deployed there. There is still an example of how to set up a defi interaction which will work on mainnet when Aztec Connect is launched.

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```
