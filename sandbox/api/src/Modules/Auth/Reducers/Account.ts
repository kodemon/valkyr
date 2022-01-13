import { createReducer } from "@valkyr/ledger";
import type {
  Account,
  AccountActivated,
  AccountAliasSet,
  AccountClosed,
  AccountCreated,
  AccountEmailSet,
  AccountNameSet
} from "stores";

type Event = AccountCreated | AccountActivated | AccountAliasSet | AccountNameSet | AccountEmailSet | AccountClosed;

export const account = createReducer<Account, Event>(
  {
    accountId: "",
    status: "onboarding",
    alias: "",
    name: {
      family: "",
      given: ""
    },
    email: "",
    token: ""
  },
  (state, event) => {
    switch (event.type) {
      case "AccountCreated": {
        return {
          ...state,
          accountId: event.entityId,
          email: event.data.email
        };
      }
      case "AccountActivated": {
        return {
          ...state,
          status: "active"
        };
      }
      case "AccountAliasSet": {
        return {
          ...state,
          alias: event.data.alias
        };
      }
      case "AccountNameSet": {
        return {
          ...state,
          name: event.data.name
        };
      }
      case "AccountEmailSet": {
        return {
          ...state,
          email: event.data.email
        };
      }
      case "AccountClosed": {
        return {
          ...state,
          status: "closed"
        };
      }
    }
  }
);
