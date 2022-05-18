// // https://github.com/AztecProtocol/aztec2-internal/blob/defi-bridge-project/end-to-end/src/sdk_utils.ts

const sendTokens = async (
    sender,
    recipient,
    token,
    tokenQuantity,
    settlementTime,
    sdk,
  ) => {
    const tokenAssetId = sdk.getAssetIdBySymbol('ETH'); // can also use sdk.getAssetIdByAddress(token);
    const senderSigner = await sdk.createSchnorrSigner((await sdk.getUserData(sender)).privateKey);
    const tokenTransferFee = (await sdk.getTransferFees(tokenAssetId))[settlementTime];
    const tokenAssetValue = { assetId: tokenAssetId, value: tokenQuantity };
    const tokenTransferController = sdk.createTransferController(
      sender,
      senderSigner,
      tokenAssetValue,
      tokenTransferFee,
      recipient,
    );
    await tokenTransferController.createProof();
    await tokenTransferController.send();
    return tokenTransferController;
  }

const main = async () => {
    sdk = await setup();
    const user = await sdk.addUser(AZTEC_PRIVATE_KEY);
    await sendTokens(ETHEREUM_ADDRESS, user);
  
    console.log("user", user);
    console.log("done");
  };
  
  main();