import type { Folder, VaultItem } from "@gistwarden/domain";
import { VaultItemType } from "@gistwarden/domain";
import { APP_NAME } from "@/core/constants.ts";
import type { ExportResult, ExportStrategy } from "../import-export-types.ts";

export const jsonExportStrategy: ExportStrategy = {
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
        fields: item.fields.map((f) => ({
          type: f.type ?? 0,
          name: f.name || "",
          value: f.value || "",
        })),
        creationDate: item.creationDate,
        revisionDate: item.revisionDate,
      };

      if (item.type === VaultItemType.Login) {
        return {
          ...base,
          type: VaultItemType.Login,
          reprompt: item.reprompt,
          login: {
            username: item.login.username || "",
            password: item.login.password || "",
            totp: item.login.totp || "",
            uris: item.login.uris?.map((u) => ({
              uri: u.uri,
              match: null,
            })) || [],
            fido2Credentials: item.login.fido2Credentials || [],
            passwordRevisionDate: item.login.passwordRevisionDate || null,
            passwordHistory: item.login.passwordHistory?.map((ph) => ({
              lastUsedDate: ph.lastUsedDate || null,
              password: ph.password || "",
            })) || [],
          },
        };
      } else if (item.type === VaultItemType.Card) {
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
      } else if (item.type === VaultItemType.Identity) {
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
      } else if (item.type === VaultItemType.SshKey) {
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
      } else {
        return {
          ...base,
          type: VaultItemType.SecureNote,
          reprompt: item.reprompt,
          secureNote: {
            type: 0,
          },
        };
      }
    });

    const exportPayload = {
      encrypted: false,
      folders: folders || [],
      items: exportItems,
    };

    const fileContent = JSON.stringify(exportPayload, null, 2);
    const fileName = `${APP_NAME.toLowerCase()}_export_${
      new Date().toISOString().slice(0, 10)
    }.json`;

    return {
      fileName,
      fileContent,
      mimeType: "application/json",
    };
  },
};
