import { Attributes, container, createPermission, Role } from "@valkyr/access";
import { uuid } from "@valkyr/utils";

import type { Workspace } from "./Aggregate";

/*
 |--------------------------------------------------------------------------------
 | Access
 |--------------------------------------------------------------------------------
 */

export const access = {
  setup: async (workspaceId: string) => {
    await createAdminRole(workspaceId);
    await createMemberRole(workspaceId);
  },
  for: createPermission<Permissions>()
};

/*
 |--------------------------------------------------------------------------------
 | Role
 |--------------------------------------------------------------------------------
 */

export async function getWorkspaceRole(roleId: string, db = container.get("Database")) {
  const data = await db.getRole<Permissions>(roleId);
  if (data) {
    return new Role<Permissions>({
      ...data,
      permissions: getPermissions(data.permissions)
    });
  }
}

export async function createAdminRole(workspaceId: string, db = container.get("Database")): Promise<void> {
  await db.addRole({
    tenantId: workspaceId,
    roleId: uuid(),
    name: "Admin",
    settings: {},
    permissions: {
      workspace: {
        setName: true,
        addMember: true,
        delete: true
      },
      todo: {
        create: true,
        assign: true,
        setData: true,
        delete: true
      }
    },
    members: []
  });
}

export async function createMemberRole(workspaceId: string, db = container.get("Database")): Promise<void> {
  await db.addRole({
    tenantId: workspaceId,
    roleId: uuid(),
    name: "Member",
    settings: {},
    permissions: {
      todo: {
        create: true,
        assign: true,
        setData: true,
        delete: true
      }
    },
    members: []
  });
}

/*
 |--------------------------------------------------------------------------------
 | Permissions
 |--------------------------------------------------------------------------------
 */

export type Permissions = {
  workspace: {
    setName: boolean;
    addMember: boolean;
    delete: boolean;
  };
  todo: {
    create: boolean;
    assign: boolean;
    setData: boolean;
    delete: boolean;
  };
};

function getPermissions({ workspace, todo }: Partial<Permissions>): Permissions {
  return {
    workspace: {
      setName: workspace?.setName === true,
      addMember: workspace?.addMember === true,
      delete: workspace?.delete === true
    },
    todo: {
      create: todo?.create === true,
      assign: todo?.assign === true,
      setData: todo?.setData === true,
      delete: todo?.delete === true
    }
  };
}

/*
 |--------------------------------------------------------------------------------
 | Attributes
 |--------------------------------------------------------------------------------
 */

export const WORKSPACE_FLAGS: Record<keyof Workspace, number> = {
  id: 1 << 0,
  name: 1 << 1
};

export function getWorkspaceFlags(flag?: number) {
  return new Attributes(WORKSPACE_FLAGS, flag);
}