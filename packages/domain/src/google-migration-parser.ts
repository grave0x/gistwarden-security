import { z } from "zod";
import { err, ok, Result } from "neverthrow";
import * as OTPAuth from "otpauth";
import type { TranslationKey } from "./i18n.ts";

export const GoogleOtpAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  secretBase32: z.string(),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512", "MD5"]),
  digits: z.number(),
  type: z.enum(["TOTP", "HOTP"]),
  counter: z.number(),
  otpauthUrl: z.string(),
}).readonly();
export type GoogleOtpAccount = z.infer<typeof GoogleOtpAccountSchema>;

export const GoogleMigrationPayloadSchema = z.object({
  accounts: z.array(GoogleOtpAccountSchema),
  version: z.number(),
  batchSize: z.number(),
  batchIndex: z.number(),
  batchId: z.number(),
}).readonly();
export type GoogleMigrationPayload = z.infer<
  typeof GoogleMigrationPayloadSchema
>;

interface VarintReadResult {
  value: number;
  nextOffset: number;
}

function readVarint(buffer: Uint8Array, startOffset: number): VarintReadResult {
  let res = 0;
  let shift = 0;
  let offset = startOffset;

  while (offset < buffer.length) {
    const byteVal = buffer[offset];
    offset += 1;
    res |= (byteVal & 0x7f) << shift;
    if ((byteVal & 0x80) === 0) {
      break;
    }
    shift += 7;
  }

  return { value: res, nextOffset: offset };
}

function mapAlgorithm(val: number): "SHA1" | "SHA256" | "SHA512" | "MD5" {
  switch (val) {
    case 2:
      return "SHA256";
    case 3:
      return "SHA512";
    case 4:
      return "MD5";
    case 1:
    default:
      return "SHA1";
  }
}

function mapDigits(val: number): number {
  switch (val) {
    case 2:
      return 8;
    case 1:
    default:
      return 6;
  }
}

function mapType(val: number): "TOTP" | "HOTP" {
  switch (val) {
    case 1:
      return "HOTP";
    case 2:
    default:
      return "TOTP";
  }
}

function decodeBase64ToBytes(base64Str: string): Uint8Array {
  const binaryStr = atob(base64Str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function generateAccountOtpauthUrl(
  name: string,
  issuer: string,
  secretBase32: string,
  algorithm: "SHA1" | "SHA256" | "SHA512" | "MD5",
  digits: number,
): string {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: issuer.trim() || undefined,
      label: name.trim() || undefined,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
      algorithm: algorithm,
      digits: digits,
    });
    return totp.toString();
  } catch (_e) {
    const encodedLabel = encodeURIComponent(
      issuer ? `${issuer}:${name}` : name,
    );
    const params = new URLSearchParams({
      secret: secretBase32,
      algorithm,
      digits: digits.toString(),
    });
    if (issuer) params.set("issuer", issuer);
    return `otpauth://totp/${encodedLabel}?${params.toString()}`;
  }
}

export function parseGoogleMigrationUri(
  rawUri: string,
): Result<GoogleMigrationPayload, TranslationKey> {
  const trimmed = rawUri.trim();
  if (!trimmed) {
    return err("import_google_migration_invalid");
  }

  let base64Data = "";
  if (trimmed.startsWith("otpauth-migration://")) {
    try {
      const parsedUrl = new URL(trimmed);
      const dataParam = parsedUrl.searchParams.get("data");
      if (!dataParam) {
        return err("import_google_migration_invalid");
      }
      base64Data = dataParam;
    } catch (_e) {
      return err("import_google_migration_invalid");
    }
  } else {
    base64Data = trimmed;
  }

  try {
    const normalizedBase64 = decodeURIComponent(base64Data)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payloadBytes = decodeBase64ToBytes(normalizedBase64);

    let offset = 0;
    const accounts: GoogleOtpAccount[] = [];
    let version = 1;
    let batchSize = 1;
    let batchIndex = 0;
    let batchId = 0;
    let accountCounterIndex = 0;

    while (offset < payloadBytes.length) {
      const { value: tagWire, nextOffset } = readVarint(payloadBytes, offset);
      offset = nextOffset;
      const tag = tagWire >> 3;
      const wireType = tagWire & 0x07;

      if (wireType === 2) {
        const { value: fieldLength, nextOffset: lenOffset } = readVarint(
          payloadBytes,
          offset,
        );
        offset = lenOffset;

        const fieldBytes = payloadBytes.subarray(offset, offset + fieldLength);
        offset += fieldLength;

        if (tag === 1) {
          let innerOffset = 0;
          let rawSecret: Uint8Array | null = null;
          let name = "";
          let issuer = "";
          let algoCode = 1;
          let digitsCode = 1;
          let typeCode = 2;
          let counterVal = 0;

          while (innerOffset < fieldBytes.length) {
            const { value: innerTagWire, nextOffset: innerNext } = readVarint(
              fieldBytes,
              innerOffset,
            );
            innerOffset = innerNext;
            const innerTag = innerTagWire >> 3;
            const innerWire = innerTagWire & 0x07;

            if (innerWire === 2) {
              const { value: subLen, nextOffset: subLenNext } = readVarint(
                fieldBytes,
                innerOffset,
              );
              innerOffset = subLenNext;
              const subBytes = fieldBytes.subarray(
                innerOffset,
                innerOffset + subLen,
              );
              innerOffset += subLen;

              if (innerTag === 1) {
                rawSecret = subBytes;
              } else if (innerTag === 2) {
                name = new TextDecoder().decode(subBytes);
              } else if (innerTag === 3) {
                issuer = new TextDecoder().decode(subBytes);
              }
            } else if (innerWire === 0) {
              const { value: varintVal, nextOffset: varintNext } = readVarint(
                fieldBytes,
                innerOffset,
              );
              innerOffset = varintNext;

              if (innerTag === 4) algoCode = varintVal;
              else if (innerTag === 5) digitsCode = varintVal;
              else if (innerTag === 6) typeCode = varintVal;
              else if (innerTag === 7) counterVal = varintVal;
            }
          }

          if (rawSecret && rawSecret.length > 0) {
            accountCounterIndex += 1;
            const secretBase32 = new OTPAuth.Secret({
              buffer: Uint8Array.from(rawSecret).buffer,
            }).base32.toUpperCase();

            const algorithm = mapAlgorithm(algoCode);
            const digits = mapDigits(digitsCode);
            const type = mapType(typeCode);
            const otpauthUrl = generateAccountOtpauthUrl(
              name,
              issuer,
              secretBase32,
              algorithm,
              digits,
            );

            accounts.push({
              id: `google-otp-${accountCounterIndex}-${Date.now()}`,
              name,
              issuer,
              secretBase32,
              algorithm,
              digits,
              type,
              counter: counterVal,
              otpauthUrl,
            });
          }
        }
      } else if (wireType === 0) {
        const { value: varintVal, nextOffset: valOffset } = readVarint(
          payloadBytes,
          offset,
        );
        offset = valOffset;

        if (tag === 2) version = varintVal;
        else if (tag === 3) batchSize = varintVal;
        else if (tag === 4) batchIndex = varintVal;
        else if (tag === 5) batchId = varintVal;
      }
    }

    if (accounts.length === 0) {
      return err("import_google_migration_invalid");
    }

    return ok({
      accounts,
      version,
      batchSize,
      batchIndex,
      batchId,
    });
  } catch (_err) {
    return err("import_google_migration_invalid");
  }
}
