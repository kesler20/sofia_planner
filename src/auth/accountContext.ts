import * as React from "react";

export const AccountContext = React.createContext<string | null>(null);

export function useAccount(): string {
  const account = React.useContext(AccountContext);
  if (!account) throw new Error("An authenticated account is required");
  return account;
}
