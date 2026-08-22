import {
  asFido2CredentialId,
  asRpId,
  createBaseVaultItem,
  FieldType,
  type Folder,
  FolderSchema,
  getVaultItemFallbackName,
  type ImportItem,
  ImportItemSchema,
  LoginLinkedId,
  logger,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "@gistwarden/domain";
import { mergeFolders } from "@gistwarden/orchestrator";
import { err, ok, type Result } from "neverthrow";
import { APP_NAME } from "@/core/constants.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import type { ImportResult, ImportStrategy } from "../import-export-types.ts";

const LINKED_ID_TO_CANONICAL_KEY: Record<number, string> = {
  [LoginLinkedId.Username]: "username",
  [LoginLinkedId.Password]: "password",
  [LoginLinkedId.Totp]: "totp",
};

const LINKED_CANONICAL_KEY_TO_ID: Record<string, number> = {
  username: LoginLinkedId.Username,
  [String(LoginLinkedId.Username)]: LoginLinkedId.Username,
  password: LoginLinkedId.Password,
  [String(LoginLinkedId.Password)]: LoginLinkedId.Password,
  totp: LoginLinkedId.Totp,
  [String(LoginLinkedId.Totp)]: LoginLinkedId.Totp,
};

function normalizeImportLinkedField(
  rawVal: string,
  rawLinkedId?: number | null,
): { value: string; linkedId: number | null } {
  let linkedId = rawLinkedId ?? null;
  let val = rawVal.trim();

  if (linkedId) {
    const canonicalKey = LINKED_ID_TO_CANONICAL_KEY[linkedId];
    if (canonicalKey && (!val || val === String(linkedId))) {
      val = canonicalKey;
    }
  } else {
    const canonicalId = LINKED_CANONICAL_KEY_TO_ID[val.toLowerCase()];
    if (canonicalId !== undefined) {
      linkedId = canonicalId;
      val = LINKED_ID_TO_CANONICAL_KEY[canonicalId] ?? val;
    }
  }

  return { value: val, linkedId };
}

function importVaultField(f: NonNullable<ImportItem["fields"]>[number]) {
  const fieldType = f.type ?? FieldType.Text;
  if (fieldType === FieldType.Linked) {
    const { value, linkedId } = normalizeImportLinkedField(
      f.value || "",
      f.linkedId,
    );
    return {
      name: f.name || "",
      value,
      type: FieldType.Linked,
      linkedId: linkedId ?? undefined,
    };
  }

  return {
    name: f.name || "",
    value: f.value || "",
    type: fieldType,
    linkedId: f.linkedId ?? undefined,
  };
}

type ImportItemConverter = (
  item: ImportItem,
  base: ReturnType<typeof createBaseVaultItem>,
  now: string,
) => VaultItem;

const IMPORT_CONVERTERS: Record<VaultItemType, ImportItemConverter> = {
  [VaultItemType.SecureNote]: (_item, base) => ({
    ...base,
    type: VaultItemType.SecureNote,
  }),
  [VaultItemType.Card]: (item, base) => {
    const cardData = item.type === VaultItemType.Card ? item.card || {} : {};
    return {
      ...base,
      type: VaultItemType.Card,
      card: {
        cardholderName: cardData.cardholderName || "",
        brand: cardData.brand || "",
        number: cardData.number || "",
        expMonth: cardData.expMonth || "",
        expYear: cardData.expYear || "",
        code: cardData.code || "",
      },
    };
  },
  [VaultItemType.Identity]: (item, base) => {
    const identityData =
      item.type === VaultItemType.Identity ? item.identity || {} : {};
    return {
      ...base,
      type: VaultItemType.Identity,
      identity: {
        title: identityData.title || "",
        firstName: identityData.firstName || "",
        middleName: identityData.middleName || "",
        lastName: identityData.lastName || "",
        username: identityData.username || "",
        company: identityData.company || "",
        ssn: identityData.ssn || "",
        passportNumber: identityData.passportNumber || "",
        licenseNumber: identityData.licenseNumber || "",
        email: identityData.email || "",
        phone: identityData.phone || "",
        address1: identityData.address1 || "",
        address2: identityData.address2 || "",
        address3: identityData.address3 || "",
        city: identityData.city || "",
        state: identityData.state || "",
        postalCode: identityData.postalCode || "",
        country: identityData.country || "",
      },
    };
  },
  [VaultItemType.SshKey]: (item, base) => {
    const sshData = item.type === VaultItemType.SshKey ? item.sshKey || {} : {};
    return {
      ...base,
      type: VaultItemType.SshKey,
      sshKey: {
        privateKey: sshData.privateKey || "",
        publicKey: sshData.publicKey || "",
        keyFingerprint: sshData.keyFingerprint || "",
      },
    };
  },
  [VaultItemType.Login]: (item, base, now) => {
    const loginData =
      item.type === VaultItemType.Login ? item.login : undefined;
    const rawFido = loginData?.fido2Credentials;
    return {
      ...base,
      type: VaultItemType.Login,
      login: {
        username: loginData?.username || "",
        password: loginData?.password || "",
        totp: loginData?.totp || "",
        uris: loginData?.uris
          ? loginData.uris.map(
              (u: { uri?: string; match?: number | null }) => ({
                uri: u.uri || "",
                match: u.match || null,
              }),
            )
          : [],
        fido2Credentials:
          rawFido?.map((c: Record<string, unknown>) => ({
            credentialId: asFido2CredentialId(String(c.credentialId || "")),
            keyType: String(c.keyType || ""),
            keyAlgorithm: String(c.keyAlgorithm || ""),
            keyCurve: String(c.keyCurve || ""),
            keyValue: String(c.keyValue || ""),
            counter: typeof c.counter === "number" ? c.counter : 0,
            rpId: asRpId(String(c.rpId || "")),
            userHandle: String(c.userHandle || ""),
            userName: String(c.userName || ""),
            userDisplayName: String(c.userDisplayName || ""),
            creationDate: String(c.creationDate || now),
            discoverable:
              typeof c.discoverable === "string"
                ? c.discoverable === "true"
                : Boolean(c.discoverable),
          })) || [],
        passwordRevisionDate: loginData?.passwordRevisionDate || null,
        passwordHistory: loginData?.passwordHistory || [],
      },
    };
  },
};

export const jsonImportStrategy = {
  id: "json",
  nameKey: "import_option_json",
  subKey: "import_option_json_sub",
  extension: ".json",
  parseAndValidate(
    jsonString: string,
    existingItems: VaultItem[],
    existingFolders: Folder[] = [],
  ): Result<ImportResult, TranslationKey> {
    logger.vault.info(`[${APP_NAME} Import] Bắt đầu đọc file JSON...`);

    const parseRes = safeJsonParse(jsonString);
    if (parseRes.isErr()) {
      logger.vault.error(`[${APP_NAME} Import] Lỗi phân tích JSON`);
      return err("vault_import_error_invalid");
    }
    const parsed = parseRes.value;

    const itemsToImport: ImportItem[] = [];
    const importedFolders: Folder[] = [];

    const rawFolders =
      parsed !== null && typeof parsed === "object"
        ? Reflect.get(parsed, "folders")
        : null;

    if (Array.isArray(rawFolders)) {
      for (const rawFolder of rawFolders) {
        const folderRes = FolderSchema.safeParse(rawFolder);
        if (folderRes.success) {
          importedFolders.push(folderRes.data);
        }
      }
    }

    let rawItems: unknown[] = [];
    const parsedItems =
      parsed !== null && typeof parsed === "object"
        ? Reflect.get(parsed, "items")
        : null;

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (Array.isArray(parsedItems)) {
      rawItems = parsedItems;
    } else {
      return err("vault_import_error_invalid");
    }

    for (const rawItem of rawItems) {
      const parseResult = ImportItemSchema.safeParse(rawItem);
      if (parseResult.success) {
        itemsToImport.push(parseResult.data);
      } else {
        logger.vault.warn(
          `[${APP_NAME} Import] Bỏ qua item không hỗ trợ hoặc lỗi định dạng:`,
          parseResult.error.issues,
        );
      }
    }

    logger.vault.info(
      `[${APP_NAME} Import] Kiểm tra xong! Có ${itemsToImport.length} tài khoản và ${importedFolders.length} thư mục hợp lệ cần import.`,
    );

    const now = new Date().toISOString();
    const newVaultItems: VaultItem[] = itemsToImport.map((item) => {
      const base = createBaseVaultItem({
        id: item.id || undefined,
        folderId: item.folderId || null,
        name: item.name,
        notes: item.notes,
        favorite: item.favorite,
        reprompt: item.reprompt,
        fields: item.fields?.map(importVaultField),
        creationDate: item.creationDate || undefined,
        revisionDate: item.revisionDate || undefined,
        fallbackName: getVaultItemFallbackName(item.type),
      });

      const converter =
        IMPORT_CONVERTERS[item.type] ?? IMPORT_CONVERTERS[VaultItemType.Login];
      return converter(item, base, now);
    });

    const existingMap = new Map<string, VaultItem>();
    for (const item of existingItems) {
      if (item.type === VaultItemType.Login) {
        if (
          item.login?.uris &&
          item.login.uris.length > 0 &&
          item.login.uris[0]
        ) {
          const mainUri = item.login.uris[0].uri;
          const key = `${mainUri}|${item.login.username}`;
          existingMap.set(key, item);
        } else {
          existingMap.set(`||${item.name}`, item);
        }
      } else {
        existingMap.set(`||${item.name}`, item);
      }
    }

    let addedCount = 0;
    const finalItems = [...existingItems];

    for (const newItem of newVaultItems) {
      if (newItem.type === VaultItemType.Login) {
        const uri = newItem.login?.uris?.[0]?.uri || "";
        const username = newItem.login?.username || "";
        const key = uri ? `${uri}|${username}` : `||${newItem.name}`;

        if (!existingMap.has(key)) {
          finalItems.push(newItem);
          existingMap.set(key, newItem);
          addedCount++;
        } else {
          const existingItem = existingMap.get(key)!;
          if (
            existingItem.type === VaultItemType.Login &&
            newItem.login?.fido2Credentials &&
            newItem.login.fido2Credentials.length > 0
          ) {
            const existingFido = existingItem.login?.fido2Credentials || [];
            const mergedFido = [...existingFido];
            let fidoAdded = false;

            for (const newFido of newItem.login.fido2Credentials) {
              const fidoExists = existingFido.some(
                (f) => f.credentialId === newFido.credentialId,
              );
              if (!fidoExists) {
                mergedFido.push(newFido);
                fidoAdded = true;
              }
            }

            if (fidoAdded && existingItem.login) {
              existingItem.login.fido2Credentials = mergedFido;
            }
          }
        }
      } else {
        const key = `||${newItem.name}`;
        if (!existingMap.has(key)) {
          finalItems.push(newItem);
          existingMap.set(key, newItem);
          addedCount++;
        }
      }
    }

    const validateResult = VaultListSchema.safeParse(finalItems);
    if (!validateResult.success) {
      logger.vault.error(
        `[${APP_NAME} Import] Lỗi kiểm tra dữ liệu sau khi gộp:`,
        validateResult.error,
      );
      return err("storage_error");
    }

    const combinedFolders = mergeFolders(existingFolders, importedFolders);

    return ok({
      importedCount: addedCount,
      combinedItems: validateResult.data,
      combinedFolders,
    });
  },
} satisfies ImportStrategy;
