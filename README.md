# dev-connect-workshop

## Requirements

1. Node
2. Yarn
3. Goerli ETH. You can get some here. https://goerli-faucet.mudit.blog/

## Run

Install dependencies

```shell
yarn
```

Runs script, `./src/index.ts`:

```shell
yarn go
```

## Environment

The script currently runs on a version of Aztec connected to the Goerli testnet.

You can check the status of the Aztec rollup provider at this url. https://api.aztec.network/aztec-connect-testnet/falafel/status

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```