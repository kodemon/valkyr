import { Action } from "@valkyr/router";

import { Auth } from "../../pages/auth";
import { setPageTitle } from "../../Utils/Dom";

export function renderAuthorized(components: any[], title: string): Action {
  return async function () {
    if (!localStorage.getItem("token")) {
      setPageTitle("Authorize");
      return this.render([Auth]);
    }
    setPageTitle(title);
    return this.render(components);
  };
}