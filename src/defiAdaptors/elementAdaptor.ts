// @ts-nocheck
import { BridgeDataFieldGetters } from '@aztec/bridge-clients/client-dest/src/client/bridge-data';
import {
    ElementBridgeData,
    ChainProperties,
  } from '@aztec/bridge-clients/client-dest/src/client/element/element-bridge-data';
  import { EthAddress } from '@aztec/sdk';
  
  export const createElementAdaptor = (
    provider,
    rollupContractAddress,
    bridgeContractAddress,
    isMainnet,
  ) : BridgeDataFieldGetters => {
    const balancerAddress = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
    const batchSize = isMainnet ? 10000 : 10;
    const chainProperties: ChainProperties = { eventBatchSize: batchSize };
    return ElementBridgeData.create(
      provider,
      EthAddress.fromString(bridgeContractAddress) as any,
      EthAddress.fromString(balancerAddress) as any,
      EthAddress.fromString(rollupContractAddress) as any,
      chainProperties,
    );
  };