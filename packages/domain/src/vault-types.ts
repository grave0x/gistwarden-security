import type { TranslationKey } from "./i18n.ts";
import type {
  CardVaultItem,
  IdentityVaultItem,
  LoginVaultItem,
  SecureNoteVaultItem,
  SshKeyVaultItem,
  VaultItem,
} from "./vault-schemas.ts";

export type VaultMode = "github_gist" | "local_storage" | "self_hosted_server";

export enum VaultItemType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  Identity = 4,
  SshKey = 5,
}
export const CipherType = VaultItemType;
export type CipherType = VaultItemType;

export enum CustomFieldType {
  Text = 0,
  Hidden = 1,
  Boolean = 2,
  Linked = 3,
  Divider = 10,
}
export const FieldType = CustomFieldType;
export type FieldType = CustomFieldType;

/**
 * LinkedIdType matching Bitwarden specification
 */
// LoginView
export const LoginLinkedId = {
  Username: 100,
  Password: 101,
  Totp: 102,
} as const;
export type LoginLinkedId = (typeof LoginLinkedId)[keyof typeof LoginLinkedId];

export interface LinkedFieldOptionDef {
  id: number;
  key: string;
  labelKey: TranslationKey;
}

export const LOGIN_LINKED_FIELDS: readonly LinkedFieldOptionDef[] = [
  {
    id: LoginLinkedId.Username,
    key: "username",
    labelKey: "edit_label_username",
  },
  {
    id: LoginLinkedId.Password,
    key: "password",
    labelKey: "edit_label_password",
  },
  {
    id: LoginLinkedId.Totp,
    key: "totp",
    labelKey: "edit_label_totp",
  },
] as const;

// CardView
export const CardLinkedId = {
  CardholderName: 300,
  ExpMonth: 301,
  ExpYear: 302,
  Code: 303,
  Brand: 304,
  Number: 305,
} as const;
export type CardLinkedId = (typeof CardLinkedId)[keyof typeof CardLinkedId];

// IdentityView
export const IdentityLinkedId = {
  Title: 400,
  MiddleName: 401,
  Address1: 402,
  Address2: 403,
  Address3: 404,
  City: 405,
  State: 406,
  PostalCode: 407,
  Country: 408,
  Company: 409,
  Email: 410,
  Phone: 411,
  Ssn: 412,
  Username: 413,
  PassportNumber: 414,
  LicenseNumber: 415,
  FirstName: 416,
  LastName: 417,
  FullName: 418,
} as const;
export type IdentityLinkedId =
  (typeof IdentityLinkedId)[keyof typeof IdentityLinkedId];

export type LinkedIdType = LoginLinkedId | CardLinkedId | IdentityLinkedId;

/**
 * CipherRepromptType matching Bitwarden specification
 */
export enum CipherRepromptType {
  None = 0,
  Password = 1,
}

/**
 * SecureNoteType matching Bitwarden specification
 */
export enum SecureNoteType {
  Generic = 0,
}

/**
 * UriMatchStrategy matching Bitwarden specification
 */
export enum UriMatchStrategy {
  Domain = 0,
  Host = 1,
  StartsWith = 2,
  Exact = 3,
  RegularExpression = 4,
  Never = 5,
}

export const isLoginItem = (item: VaultItem): item is LoginVaultItem => {
  return Number(item.type) === VaultItemType.Login;
};

export const isSecureNoteItem = (
  item: VaultItem,
): item is SecureNoteVaultItem => {
  return Number(item.type) === VaultItemType.SecureNote;
};

export const isCardItem = (item: VaultItem): item is CardVaultItem => {
  return Number(item.type) === VaultItemType.Card;
};

export const isIdentityItem = (item: VaultItem): item is IdentityVaultItem => {
  return Number(item.type) === VaultItemType.Identity;
};

export const isSshKeyItem = (item: VaultItem): item is SshKeyVaultItem => {
  return Number(item.type) === VaultItemType.SshKey;
};
