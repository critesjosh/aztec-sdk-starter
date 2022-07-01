import { AztecAsset } from "@aztec/bridge-clients/client-dest/src/client/bridge-data";

export const AZTEC_ASSETS: AztecAsset[] = [
  // ETH
  {
    id: 0n,
    assetType: 0,
    erc20Address: "0x0000000000000000000000000000000000000000",
  },
  // DAI
  {
    id: 1n,
    assetType: 1,
    erc20Address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  // wstETH
  {
    id: 2n,
    assetType: 1,
    erc20Address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
  }
];
