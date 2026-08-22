import {
  FieldType,
  type Folder,
  LoginLinkedId,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { APP_NAME } from "@/core/constants.ts";
import type { ExportResult, ExportStrategy } from "../import-export-types.ts";

type ExportItemConverter = (
  item: VaultItem,
  base: Record<string, unknown>,
) => Record<string, unknown>;

const EXPORT_CONVERTERS: Record<VaultItemType, ExportItemConverter> = {
  [VaultItemType.Login]: (item, base) => {
    if (item.type !== VaultItemType.Login) return base;
    return {
      ...base,
      type: VaultItemType.Login,
      reprompt: item.reprompt,
      login: {
        username: item.login.username || "",
        password: item.login.password || "",
        totp: item.login.totp || "",
        uris:
          item.login.uris?.map((u) => ({
            uri: u.uri,
            match: null,
          })) || [],
        fido2Credentials: item.login.fido2Credentials || [],
        passwordRevisionDate: item.login.passwordRevisionDate || null,
        passwordHistory:
          item.login.passwordHistory?.map((ph) => ({
            lastUsedDate: ph.lastUsedDate || null,
            password: ph.password || "",
          })) || [],
      },
    };
  },
  [VaultItemType.Card]: (item, base) => {
    if (item.type !== VaultItemType.Card) return base;
    return {
      ...base,
      type: VaultItemType.Card,
      reprompt: item.reprompt,
      card: {
        cardholderName: item.card.cardholderName || "",
        brand: item.card.brand || "",
        number: item.card.number || "",
        expMonth: item.card.expMonth || "",
        expYear: item.card.expYear || "",
        code: item.card.code || "",
      },
    };
  },
  [VaultItemType.Identity]: (item, base) => {
    if (item.type !== VaultItemType.Identity) return base;
    return {
      ...base,
      type: VaultItemType.Identity,
      reprompt: item.reprompt,
      identity: {
        title: item.identity.title || "",
        firstName: item.identity.firstName || "",
        middleName: item.identity.middleName || "",
        lastName: item.identity.lastName || "",
        username: item.identity.username || "",
        company: item.identity.company || "",
        ssn: item.identity.ssn || "",
        passportNumber: item.identity.passportNumber || "",
        licenseNumber: item.identity.licenseNumber || "",
        email: item.identity.email || "",
        phone: item.identity.phone || "",
        address1: item.identity.address1 || "",
        address2: item.identity.address2 || "",
        address3: item.identity.address3 || "",
        city: item.identity.city || "",
        state: item.identity.state || "",
        postalCode: item.identity.postalCode || "",
        country: item.identity.country || "",
      },
    };
  },
  [VaultItemType.SecureNote]: (item, base) => {
    return {
      ...base,
      type: VaultItemType.SecureNote,
      reprompt: item.reprompt,
      secureNote: {
        type: 0,
      },
    };
  },
  [VaultItemType.SshKey]: (item, base) => {
    if (item.type !== VaultItemType.SshKey) return base;
    return {
      ...base,
      type: VaultItemType.SshKey,
      reprompt: item.reprompt,
      sshKey: {
        privateKey: item.sshKey.privateKey || "",
        publicKey: item.sshKey.publicKey || "",
        keyFingerprint: item.sshKey.keyFingerprint || "",
      },
    };
  },
};

const LINKED_STRING_TO_ID: Record<string, number> = {
  username: LoginLinkedId.Username,
  [String(LoginLinkedId.Username)]: LoginLinkedId.Username,
  password: LoginLinkedId.Password,
  [String(LoginLinkedId.Password)]: LoginLinkedId.Password,
  totp: LoginLinkedId.Totp,
  [String(LoginLinkedId.Totp)]: LoginLinkedId.Totp,
};

function resolveExportLinkedId(f: VaultItem["fields"][number]): number {
  if (typeof f.linkedId === "number" && !isNaN(f.linkedId)) {
    return f.linkedId;
  }
  const val = String(f.value || "")
    .toLowerCase()
    .trim();
  const foundId = LINKED_STRING_TO_ID[val];
  if (foundId !== undefined) {
    return foundId;
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  return LoginLinkedId.Username;
}

interface ExportedVaultField {
  name: string;
  value: string | null;
  type: FieldType;
  linkedId: number | null;
}

const FIELD_EXPORT_TRANSFORMERS: Record<
  FieldType,
  (f: VaultItem["fields"][number]) => ExportedVaultField
> = {
  [FieldType.Linked]: (f) => ({
    name: f.name || "",
    value: null,
    type: FieldType.Linked,
    linkedId: resolveExportLinkedId(f),
  }),
  [FieldType.Boolean]: (f) => ({
    name: f.name || "",
    value: f.value === "true" || f.value === "1" ? "true" : "false",
    type: FieldType.Boolean,
    linkedId: null,
  }),
  [FieldType.Text]: (f) => ({
    name: f.name || "",
    value: f.value != null ? String(f.value) : "",
    type: FieldType.Text,
    linkedId: null,
  }),
  [FieldType.Hidden]: (f) => ({
    name: f.name || "",
    value: f.value != null ? String(f.value) : "",
    type: FieldType.Hidden,
    linkedId: null,
  }),
  [FieldType.Divider]: (f) => ({
    name: f.name || "",
    value: "",
    type: FieldType.Divider,
    linkedId: null,
  }),
};

function exportVaultField(f: VaultItem["fields"][number]): ExportedVaultField {
  const fieldType = f.type ?? FieldType.Text;
  const transformer =
    FIELD_EXPORT_TRANSFORMERS[fieldType] ??
    FIELD_EXPORT_TRANSFORMERS[FieldType.Text];
  return transformer(f);
}

export const jsonExportStrategy = {
  id: "json",
  nameKey: "export_option_json",
  subKey: "export_option_json_sub",
  extension: ".json",
  mimeType: "application/json",
  export(items: VaultItem[], folders: Folder[] = []): ExportResult {
    const exportItems = items.map((item) => {
      const base = {
        id: item.id,
        folderId: item.folderId || null,
        type: item.type,
        name: item.name,
        notes: item.notes || "",
        favorite: item.favorite,
        fields: item.fields.map(exportVaultField),
        creationDate: item.creationDate,
        revisionDate: item.revisionDate,
      };

      const converter =
        EXPORT_CONVERTERS[item.type] ??
        EXPORT_CONVERTERS[VaultItemType.SecureNote];
      return converter(item, base);
    });

    const exportPayload = {
      encrypted: false,
      folders: folders || [],
      items: exportItems,
    };

    const fileContent = JSON.stringify(exportPayload, null, 2);
    const fileName = `${APP_NAME.toLowerCase()}_export_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return {
      fileName,
      fileContent,
      mimeType: "application/json",
    };
  },
} satisfies ExportStrategy;
