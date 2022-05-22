import { ExportedKeyPair, getId, KeyPair } from "@valkyr/security";

/**
 * UserIdentity
 *
 * This class is designed to hold the individual user identities spawned
 * from a single private identity instance. Each user stores its own
 * public and private key, along with content id and user data. A user
 * identity serves as a key identifier for external services, such as
 * being a member of a organization.
 *
 * User identities are stored and managed by a PrivateIdentity, and are
 * persisted through a PrivateIdentity. User identities are not meant to
 * be shared as a whole, but in parts based on their registrars needs.
 *
 * The most common use cases for sharing includes but is not limited to
 * the users cid, publicKey, and partial data points such as name, email,
 * username, etc.
 */
export class UserIdentity<Data extends RecordLike = RecordLike> {
  readonly cid: string;

  #data: Data;
  #keys: KeyPair;

  constructor(props: UserIdentityProps<Data>) {
    this.cid = props.cid;
    this.#data = props.data;
    this.#keys = props.keys;
  }

  // ### Instantiators

  static async create<Data extends RecordLike = RecordLike>(data: Data): Promise<UserIdentity> {
    return new UserIdentity({
      cid: getId(),
      data,
      keys: await KeyPair.create()
    });
  }

  static async import(schema: UserIdentitySchema): Promise<UserIdentity> {
    return new UserIdentity({
      cid: schema.cid,
      data: schema.data,
      keys: await KeyPair.import(schema.keys)
    });
  }

  get data() {
    return this.#data;
  }

  /**
   * Encrypt given data using the users public key.
   *
   * @param value - Value to encrypt.
   */
  get encrypt() {
    return this.keys.encrypt.bind(this.#keys);
  }

  /**
   * Decrypt provided text using the users private key. This allows users
   * to receive encrypted personal data or data provided by third parties.
   *
   * @param text - Text value to decrypt.
   */
  get decrypt() {
    return this.keys.decrypt.bind(this.#keys);
  }

  get keys() {
    return this.#keys;
  }

  /**
   * Provide public key as a storable string for use by third party
   * sources to create encrypted data which only the user can consume.
   */
  async publicKey(): Promise<string> {
    return (await this.#keys.export()).publicKey;
  }

  // ### Data Utilities

  update(data: Partial<Data>) {
    this.#data = {
      ...this.#data,
      ...data
    };
  }

  async export(): Promise<UserIdentitySchema> {
    return {
      cid: this.cid,
      data: this.data,
      keys: await this.keys.export()
    };
  }
}

export type RecordLike = Record<string, unknown>;

export type UserIdentitySchema<Data extends RecordLike = RecordLike> = {
  cid: string;
  data: Data;
  keys: ExportedKeyPair;
};

type UserIdentityProps<Data extends RecordLike = RecordLike> = {
  cid: string;
  data: Data;
  keys: KeyPair;
};
