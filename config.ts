// @ts-nocheck
import { AztecAsset } from "@aztec/bridge-clients/client-dest/src/client/bridge-data";
import { EthAddress } from "@aztec/sdk";

export const AZTEC_ASSETS: AztecAsset[] = [
  // ETH
  {
    id: 0,
    assetType: 0,
    erc20Address: EthAddress.fromString("0x0000000000000000000000000000000000000000"),
  },
  // DAI
  {
    id: 1,
    assetType: 1,
    erc20Address: EthAddress.fromString("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  },
  // wstETH
  {
    id: 2,
    assetType: 1,
    erc20Address: EthAddress.fromString("0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0")
  }
];
