import { z } from "zod";
import {
  MSG_CHECK_AUTOFILL_SUGGESTION,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_SAVE_CREDENTIAL_ACTION,
  MSG_USER_ACTIVITY,
} from "./constants.ts";
import { CustomFieldType, VaultItemType } from "./vault-types.ts";
import { Fido2CredentialSchema } from "./fido2-schemas.ts";
import { createSuccessPayloadResponseSchema } from "./types.ts";

export enum UriMatchMode {
  Domain = 0,
  Host = 1,
  StartsWith = 2,
  Exact = 3,
  Regex = 4,
  Never = 5,
}

export const UriMatchModeSchema = z.nativeEnum(UriMatchMode);

export const LoginUriSchema = z.object({
  uri: z.string(),
  match: UriMatchModeSchema.nullish(),
}).readonly();
export type LoginUri = z.infer<typeof LoginUriSchema>;

export const PasswordHistorySchema = z.object({
  lastUsedDate: z.string().nullish(),
  password: z.string().nullish(),
}).readonly();
export type PasswordHistory = z.infer<typeof PasswordHistorySchema>;

export const CustomFieldTypeSchema = z.nativeEnum(CustomFieldType);

export const VaultFieldSchema = z.object({
  type: CustomFieldTypeSchema.default(CustomFieldType.Text),
  name: z.string().or(z.null()).optional().transform((v) => v || ""),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.null()])
    .optional()
    .transform((v) => (v == null ? "" : String(v))),
}).readonly();
export type VaultField = z.infer<typeof VaultFieldSchema>;

export const VaultItemIdSchema = z.string().brand<"VaultItemId">();
export type VaultItemId = z.infer<typeof VaultItemIdSchema>;

export const FolderIdSchema = z.string().brand<"FolderId">();
export type FolderId = z.infer<typeof FolderIdSchema>;

export const GistIdSchema = z.string().brand<"GistId">();
export type GistId = z.infer<typeof GistIdSchema>;

export const GitHubAccessTokenSchema = z.string().brand<"GitHubAccessToken">();
export type GitHubAccessToken = z.infer<typeof GitHubAccessTokenSchema>;

export function asVaultItemId(id: string): VaultItemId {
  return VaultItemIdSchema.parse(id);
}

export function asFolderId(id: string): FolderId {
  return FolderIdSchema.parse(id);
}

export function asGistId(id: string): GistId {
  return GistIdSchema.parse(id);
}

export function asGitHubAccessToken(token: string): GitHubAccessToken {
  return GitHubAccessTokenSchema.parse(token);
}




export const FolderSchema = z.object({
  id: FolderIdSchema,
  name: z.string(),
}).readonly();
export type Folder = z.infer<typeof FolderSchema>;

export const BaseVaultItemSchema = z.object({
  id: VaultItemIdSchema,
  folderId: FolderIdSchema.or(z.null()).optional(),
  name: z.string(),
  notes: z.string().optional(),
  favorite: z.boolean(),
  reprompt: z.number(),
  fields: z.array(VaultFieldSchema),
  creationDate: z.string(),
  revisionDate: z.string(),
});
export type BaseVaultItem = z.infer<typeof BaseVaultItemSchema>;


export const LoginVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Login),
  login: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    totp: z.string().optional(),
    uris: z.array(LoginUriSchema).optional(),
    fido2Credentials: z.array(Fido2CredentialSchema).optional(),
    passwordRevisionDate: z.string().nullish(),
    passwordHistory: z.array(PasswordHistorySchema).nullish(),
  }),
}).readonly();
export type LoginVaultItem = z.infer<typeof LoginVaultItemSchema>;

export const SecureNoteVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SecureNote),
}).readonly();
export type SecureNoteVaultItem = z.infer<typeof SecureNoteVaultItemSchema>;

const nullableString = () =>
  z.string().or(z.null()).optional().transform((v) => v || "");

export const CardSchema = z.object({
  cardholderName: nullableString(),
  brand: nullableString(),
  number: nullableString(),
  expMonth: nullableString(),
  expYear: nullableString(),
  code: nullableString(),
}).readonly();
export type CardDetails = z.infer<typeof CardSchema>;

export const IdentitySchema = z.object({
  title: nullableString(),
  firstName: nullableString(),
  middleName: nullableString(),
  lastName: nullableString(),
  username: nullableString(),
  company: nullableString(),
  ssn: nullableString(),
  passportNumber: nullableString(),
  licenseNumber: nullableString(),
  email: nullableString(),
  phone: nullableString(),
  address1: nullableString(),
  address2: nullableString(),
  address3: nullableString(),
  city: nullableString(),
  state: nullableString(),
  postalCode: nullableString(),
  country: nullableString(),
}).readonly();
export type IdentityDetails = z.infer<typeof IdentitySchema>;

export const IdentityVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Identity),
  identity: IdentitySchema,
}).readonly();
export type IdentityVaultItem = z.infer<typeof IdentityVaultItemSchema>;

export const CardVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Card),
  card: CardSchema,
}).readonly();
export type CardVaultItem = z.infer<typeof CardVaultItemSchema>;

export const SshKeySchema = z.object({
  privateKey: nullableString(),
  publicKey: nullableString(),
  keyFingerprint: nullableString(),
}).readonly();
export type SshKeyDetails = z.infer<typeof SshKeySchema>;

export const SshKeyVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SshKey),
  sshKey: SshKeySchema,
}).readonly();
export type SshKeyVaultItem = z.infer<typeof SshKeyVaultItemSchema>;



const BaseVaultItemUnionSchema = z.discriminatedUnion("type", [
  LoginVaultItemSchema,
  SecureNoteVaultItemSchema,
  CardVaultItemSchema,
  IdentityVaultItemSchema,
  SshKeyVaultItemSchema,
]);

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export const VaultItemSchema = z.preprocess((val) => {
  if (isObjectRecord(val) && "type" in val) {
    const numType = Number(val.type);
    if (!Number.isNaN(numType)) {
      return { ...val, type: numType };
    }
  }
  return val;
}, BaseVaultItemUnionSchema);

export type VaultItem = z.infer<typeof BaseVaultItemUnionSchema>;

export const VaultListSchema = z.array(VaultItemSchema);
export type VaultList = z.infer<typeof VaultListSchema>;

export const TrashVaultItemSchema = z.object({
  item: VaultItemSchema,
  deletedDate: z.string(),
});
export type TrashVaultItem = z.infer<typeof TrashVaultItemSchema>;

export const VaultPayloadSchema = z.object({
  folders: z.array(FolderSchema).optional().default([]),
  items: z.array(VaultItemSchema).default([]),
  trash: z.array(TrashVaultItemSchema).optional().default([]),
});
export type VaultPayload = z.infer<typeof VaultPayloadSchema>;

// --- Notification & Autofill Messaging Schemas ---
export const AddCredentialPayloadSchema = z.object({
  actionType: z.literal("add"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  onDismiss: z.custom<() => void>().optional(),
});
export type AddCredentialPayload = z.infer<typeof AddCredentialPayloadSchema>;

export const UpdateCredentialPayloadSchema = z.object({
  actionType: z.literal("update"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string(),
  onDismiss: z.custom<() => void>().optional(),
});
export type UpdateCredentialPayload = z.infer<
  typeof UpdateCredentialPayloadSchema
>;

export type SaveCredentialPayload =
  | AddCredentialPayload
  | UpdateCredentialPayload;

export const AccountItemSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  username: z.string(),
  password: z.string().optional(),
  totp: z.string().optional(),
});
export type AutofillMatchingAccount = z.infer<typeof AccountItemSchema>;

export const AutofillSuggestionPayloadSchema = z.object({
  actionType: z.literal("autofill"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string().optional(),
  totp: z.string().optional(),
  accounts: z.array(AccountItemSchema).optional(),
  onFill: z.custom<(selectedAcc?: AutofillMatchingAccount) => void>()
    .optional(),
  onDismiss: z.custom<() => void>().optional(),
});
export type AutofillSuggestionPayload = z.infer<
  typeof AutofillSuggestionPayloadSchema
>;

export const NotificationPayloadSchema = z.discriminatedUnion("actionType", [
  AddCredentialPayloadSchema,
  UpdateCredentialPayloadSchema,
  AutofillSuggestionPayloadSchema,
]);
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

export const AddActionPayloadSchema = z.object({
  actionType: z.literal("add"),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
});
export const UpdateActionPayloadSchema = z.object({
  actionType: z.literal("update"),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
  itemId: z.string(),
});
export const SaveActionPayloadSchema = z.discriminatedUnion("actionType", [
  AddActionPayloadSchema,
  UpdateActionPayloadSchema,
]);
export type SaveActionPayload = z.infer<typeof SaveActionPayloadSchema>;

export const CheckAutofillSuggestionMsgSchema = z.object({
  type: z.literal(MSG_CHECK_AUTOFILL_SUGGESTION),
  domain: z.string().optional(),
});
export type CheckAutofillSuggestionMsg = z.infer<
  typeof CheckAutofillSuggestionMsgSchema
>;

export const CheckAutofillSuggestionResponseSchema = z.discriminatedUnion(
  "success",
  [
    z.object({
      success: z.literal(true),
      payload: AutofillSuggestionPayloadSchema,
    }),
    z.object({
      success: z.literal(false),
      reason: z.enum(["invalid_domain", "locked", "no_matches"]),
    }),
  ],
);
export type CheckAutofillSuggestionResponse = z.infer<
  typeof CheckAutofillSuggestionResponseSchema
>;

export const CheckPendingNotificationMsgSchema = z.object({
  type: z.literal(MSG_CHECK_PENDING_NOTIFICATION),
  content: z.string().optional(),
});
export type CheckPendingNotificationMsg = z.infer<
  typeof CheckPendingNotificationMsgSchema
>;

export const CheckPendingNotificationResponseSchema =
  createSuccessPayloadResponseSchema(z.unknown());
export type CheckPendingNotificationResponse = z.infer<
  typeof CheckPendingNotificationResponseSchema
>;

export const CredentialsSubmittedMsgSchema = z.object({
  type: z.literal(MSG_CREDENTIALS_SUBMITTED),
  credentials: z.unknown().optional(),
});
export type CredentialsSubmittedMsg = z.infer<
  typeof CredentialsSubmittedMsgSchema
>;

export const SaveCredentialActionMsgSchema = z.object({
  type: z.literal(MSG_SAVE_CREDENTIAL_ACTION),
  choice: z.string().optional(),
  payload: z.unknown().optional(),
});
export type SaveCredentialActionMsg = z.infer<
  typeof SaveCredentialActionMsgSchema
>;

export const SaveCredentialActionResponseSchema = z.object({
  success: z.boolean(),
});
export type SaveCredentialActionResponse = z.infer<
  typeof SaveCredentialActionResponseSchema
>;

export const UserActivityMsgSchema = z.object({
  type: z.literal(MSG_USER_ACTIVITY),
});
export type UserActivityMsg = z.infer<typeof UserActivityMsgSchema>;
