# Aztec demo web app

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This only works on the Goerli testnet.

It allows a user to connect to Metamask and initializes the Aztec SDK to the Goerli testnet. It includes buttons to:

- Connect to Metamask
- login (sign a message to create your Aztec privacy key from your Metamask account)
- log the current SDK object
- Initialize the users Aztec accounts and log the balances
  - Account with nonce 0 is the privacy account and is not typically used to deposit or transfer funds. It is used for registering account with nonce 1 and decrypting notes.
  - Account with nonce 1 is the spending account. The signing key associated with this account is used to spend notes. It must be registered with account 0 before it can be used.
- Create the singer for account with nonce 1
- Deposit Eth to account 1 from the connected Metamask account.

The SDK functions are copied from `../src`. You can reference the files in that directory to see how to implement additional functionality.

It is required that you serve the `barretenberg.wasm` file from the server for the SDK to work.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
