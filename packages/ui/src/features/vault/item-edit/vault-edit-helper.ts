import { z } from "zod";
import {
  createBaseVaultItem,
  createDefaultVaultItem as createDomainDefaultVaultItem,
  Fido2CredentialSchema,
  LoginUriSchema,
  VaultFieldSchema,
  VaultItemType,
} from "@gistwarden/domain";
import type {
  CardVaultItem,
  IdentityVaultItem,
  LoginVaultItem,
  SecureNoteVaultItem,
  SshKeyVaultItem,
  VaultItem,
} from "@gistwarden/domain";
import { getVaultItemStrategy } from "@/features/vault/registry/vault-item-registry.ts";

export const ItemEditFormSchema = z.object({
  itemType: z.nativeEnum(VaultItemType),
  folderId: z.string().nullable().optional(),
  name: z.string(),
  notes: z.string(),
  favorite: z.boolean(),
  reprompt: z.number(),
  fields: z.array(VaultFieldSchema),
  username: z.string(),
  password: z.string(),
  uris: z.array(LoginUriSchema),
  totpSecret: z.string(),
  fidoCredentials: z.array(Fido2CredentialSchema),
  cardholderName: z.string(),
  cardNumber: z.string(),
  cardBrand: z.string(),
  cardExpMonth: z.string(),
  cardExpYear: z.string(),
  cardCode: z.string(),
  sshPrivateKey: z.string(),
  sshPublicKey: z.string(),
  sshFingerprint: z.string(),
  identityTitle: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  identityUsername: z.string(),
  company: z.string(),
  ssn: z.string(),
  passportNumber: z.string(),
  licenseNumber: z.string(),
  email: z.string(),
  phone: z.string(),
  address1: z.string(),
  address2: z.string(),
  address3: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export type ItemEditFormState = z.infer<typeof ItemEditFormSchema>;

export function getInitialFormState(
  item?: VaultItem | null,
): ItemEditFormState {
  const defaults: ItemEditFormState = {
    itemType: VaultItemType.Login,
    folderId: null,
    name: "",
    notes: "",
    favorite: false,
    reprompt: 0,
    fields: [],
    username: "",
    password: "",
    uris: [{ uri: "", match: null }],
    totpSecret: "",
    fidoCredentials: [],
    cardholderName: "",
    cardNumber: "",
    cardBrand: "",
    cardExpMonth: "",
    cardExpYear: "",
    cardCode: "",
    sshPrivateKey: "",
    sshPublicKey: "",
    sshFingerprint: "",
    identityTitle: "",
    firstName: "",
    middleName: "",
    lastName: "",
    identityUsername: "",
    company: "",
    ssn: "",
    passportNumber: "",
    licenseNumber: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };

  if (!item) return defaults;

  const state: ItemEditFormState = {
    ...defaults,
    itemType: item.type,
    folderId: item.folderId ?? null,
    name: item.name ?? "",
    notes: item.notes ?? "",
    favorite: item.favorite ?? false,
    reprompt: item.reprompt ?? 0,
    fields: item.fields ? JSON.parse(JSON.stringify(item.fields)) : [],
  };

  const strategy = getVaultItemStrategy(item.type);
  strategy.populateFormState?.(item, state);

  return state;
}

export function mapFormStateToVaultItem(
  formState: ItemEditFormState,
  selectedItem?: VaultItem | null,
): Partial<VaultItem> {
  const validatedForm = ItemEditFormSchema.parse(formState);

  const commonData = {
    id: selectedItem?.id ?? undefined,
    folderId: validatedForm.folderId ?? null,
    name: validatedForm.name.trim(),
    notes: validatedForm.notes.trim(),
    favorite: validatedForm.favorite,
    reprompt: validatedForm.reprompt,
    fields: validatedForm.fields.map((f) => ({
      type: f.type,
      name: (f.name ?? "").trim(),
      value: (f.value ?? "").trim(),
    })),
  };

  const strategy = getVaultItemStrategy(validatedForm.itemType);
  const specificPayload = strategy.mapToPayload?.(validatedForm, selectedItem) ?? {};

  return {
    ...commonData,
    type: validatedForm.itemType,
    ...specificPayload,
  } as Partial<VaultItem>;
}

export function createDefaultVaultItem(type: VaultItemType): VaultItem {
  return createDomainDefaultVaultItem({ type });
}
