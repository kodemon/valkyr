import { Container } from "@valkyr/inverse";

import { Token } from "./Token";

export const container = new Container<{
  Token: Token;
}>();
