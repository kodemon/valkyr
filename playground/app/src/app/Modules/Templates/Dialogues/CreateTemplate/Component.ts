import { Component } from "@angular/core";
import { LedgerService, ModalService } from "@valkyr/angular";
import { IdentityService } from "@valkyr/identity";
import { WorkspaceStore } from "stores";

import { WorkspaceService } from "../../../../Library/WorkspaceServices";
import { TemplateService } from "../../Services/Template";

@Component({
  templateUrl: "./Template.html"
})
export class CreateTemplateDialog {
  name = "";

  constructor(
    private identity: IdentityService,
    private ledger: LedgerService,
    private modal: ModalService,
    private template: TemplateService,
    readonly workspace: WorkspaceService
  ) {}

  async create() {
    this.close();
    const workspaceId = this.workspace.selected; // this doesnt work when not inside the workspace layout.
    if (!workspaceId) {
      throw new Error("Could not resolve workspace id");
    }
    const workspace = await this.ledger.reduce(workspaceId, WorkspaceStore.Workspace);
    if (!workspace) {
      throw new Error("Could not resolve workspace");
    }
    const member = workspace.members.getById(this.identity.auditor);
    if (!member) {
      throw new Error("Could not resolve workspace member");
    }
    this.template.create(workspaceId, this.name, member.id);
  }

  cancel() {
    this.close();
  }

  close() {
    this.modal.close();
  }
}