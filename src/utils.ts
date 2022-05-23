export const formatAliasInput = (aliasInput: string) => aliasInput.toLowerCase();

export const getAliasNonce = async (aliasInput: string, sdk) => {
  const alias = formatAliasInput(aliasInput);
  return sdk.getRemoteLatestAliasNonce(alias);
};