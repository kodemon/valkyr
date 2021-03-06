import { Aggregate, AggregateRoot } from "@valkyr/ledger";

import { EventRecord } from "./Events";

/*
 |--------------------------------------------------------------------------------
 | State
 |--------------------------------------------------------------------------------
 */

export type State = {
  id: string;
  name: string;
  invites: Invite[];
  members: Member[];
};

export type Invite = {
  id: string;
  alias: string;
  signature: string;
};

export type Member = {
  id: string;
  name: string;
};

/*
 |--------------------------------------------------------------------------------
 | Aggregate Root
 |--------------------------------------------------------------------------------
 */

export class Realm extends AggregateRoot {
  id!: string;
  name!: string;
  invites = new Invites(this);
  members = new Members(this);

  apply(event: EventRecord): void {
    switch (event.type) {
      case "RealmCreated": {
        this.id = event.streamId;
        this.name = event.data.name;
        for (const member of event.data.members) {
          this.members.add(member);
        }
        break;
      }
      case "RealmInviteCreated": {
        this.invites.add(event.data);
        break;
      }
      case "RealmInviteRemoved": {
        this.invites.remove(event.data);
        break;
      }
    }
  }

  toJSON(): State {
    return {
      id: this.id,
      name: this.name,
      invites: this.invites.toJSON(),
      members: this.members.toJSON()
    };
  }
}

/*
 |--------------------------------------------------------------------------------
 | Aggregates
 |--------------------------------------------------------------------------------
 */

class Invites extends Aggregate<Realm, Invite> {
  getById(id: string) {
    return this.index.find((invite) => invite.id === id);
  }

  getByAlias(alias: string) {
    return this.index.find((invite) => invite.alias === alias);
  }
}

class Members extends Aggregate<Realm, Member> {
  getById(id: string) {
    return this.get(id);
  }
}
