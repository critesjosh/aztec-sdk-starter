# dev-connect-workshop

## Requirements

1. Node
2. Yarn
3. Aztec mainnet fork ETH. There isn't a faucet right now, but reach out to me on twitter (@critesjosh_) or discord (joshc#0001) and I'll send you some.

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

The script currently runs on a fork of Ethereum mainnet run by Aztec.

You can check the status of the Aztec rollup provider at this url. https://api.aztec.network/aztec-connect-dev/falafel/status

## Debug

Run in terminal

```shell
export DEBUG=bb:*
```