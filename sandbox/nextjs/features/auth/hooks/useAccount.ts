import { subscribe } from "@valkyr/ledger";
import { useEffect } from "react";

import { useQuery } from "../../../hooks/useQuery";
import { auth } from "../auth";

export function useAccount() {
  const account = useQuery("accounts", { filter: { id: auth.auditor }, singleton: true });

  useEffect(() => {
    if (auth.isAuthenticated) {
      return subscribe(auth.auditor);
    }
  });

  return account;
}
