import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import type { TranslationKey } from "./i18n.ts";
import { ENGLISH_WORDLIST } from "./wordlist.ts";

/**
 * CSPRNG Rejection Sampling (RFC 8949 / Standard CSPRNG Unbiased Uniform Integer)
 * Sinh số nguyên ngẫu nhiên thuộc khoảng [0, max - 1] không bị lỗi Modulo Bias.
 */
export function getRandomBoundedInt(max: number): number {
  if (max <= 1) return 0;
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const bytes = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(bytes);
    const val = bytes[0] ?? 0;
    if (val < limit) {
      return val % max;
    }
  }
}

export const GeneratePasswordOptionsSchema = z
  .object({
    length: z.number(),
    uppercase: z.boolean(),
    lowercase: z.boolean(),
    numbers: z.boolean(),
    specials: z.boolean(),
    avoidAmbiguous: z.boolean(),
    minNumbers: z.number(),
    minSpecials: z.number(),
  })
  .readonly();
export type GeneratePasswordOptions = z.infer<
  typeof GeneratePasswordOptionsSchema
>;

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS_REGEX = /[Il1O0o]/g;

export interface PasswordCharsets {
  readonly uppercase: string;
  readonly lowercase: string;
  readonly numbers: string;
  readonly specials: string;
  readonly combined: string;
}

export function getCharset(options: GeneratePasswordOptions): PasswordCharsets {
  let uppercase = UPPERCASE_CHARS;
  let lowercase = LOWERCASE_CHARS;
  let numbers = NUMBER_CHARS;
  let specials = SPECIAL_CHARS;

  if (options.avoidAmbiguous) {
    uppercase = uppercase.replace(AMBIGUOUS_REGEX, "");
    lowercase = lowercase.replace(AMBIGUOUS_REGEX, "");
    numbers = numbers.replace(AMBIGUOUS_REGEX, "");
    specials = specials.replace(AMBIGUOUS_REGEX, "");
  }

  let combined = "";
  if (options.uppercase) combined += uppercase;
  if (options.lowercase) combined += lowercase;
  if (options.numbers) combined += numbers;
  if (options.specials) combined += specials;

  return { uppercase, lowercase, numbers, specials, combined };
}

export function generatePassword(
  options: GeneratePasswordOptions,
): Result<string, TranslationKey> {
  const charsets = getCharset(options);
  const charset = charsets.combined;

  if (!charset) {
    return err("gen_error_charset_empty");
  }

  const len = options.length;
  const minNum = options.numbers ? options.minNumbers : 0;
  const minSpec = options.specials ? options.minSpecials : 0;

  if (minNum + minSpec > len) {
    return err("gen_error_min_exceeds_length");
  }

  const resultChars: string[] = [];

  const getRandomChar = (str: string) => {
    return str[getRandomBoundedInt(str.length)] ?? "";
  };

  if (options.numbers && minNum > 0 && charsets.numbers.length > 0) {
    for (let i = 0; i < minNum; i++) {
      resultChars.push(getRandomChar(charsets.numbers));
    }
  }

  if (options.specials && minSpec > 0 && charsets.specials.length > 0) {
    for (let i = 0; i < minSpec; i++) {
      resultChars.push(getRandomChar(charsets.specials));
    }
  }

  const remaining = len - resultChars.length;
  for (let i = 0; i < remaining; i++) {
    resultChars.push(getRandomChar(charset));
  }

  // Fisher-Yates CSPRNG shuffle
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getRandomBoundedInt(i + 1);
    const temp = resultChars[i];
    const target = resultChars[j];
    if (temp !== undefined && target !== undefined) {
      resultChars[i] = target;
      resultChars[j] = temp;
    }
  }

  return ok(resultChars.join(""));
}

export const GeneratePassphraseOptionsSchema = z
  .object({
    numWords: z.number(),
    wordSeparator: z.string(),
    capitalize: z.boolean(),
    includeNumber: z.boolean(),
  })
  .readonly();
export type GeneratePassphraseOptions = z.infer<
  typeof GeneratePassphraseOptionsSchema
>;

export function generatePassphrase(
  options: GeneratePassphraseOptions,
): Result<string, TranslationKey> {
  const words = options.numWords;
  if (words < 3 || words > 20) return err("gen_error_invalid_words_count");

  const chosenWords: string[] = [];

  for (let i = 0; i < words; i++) {
    const wordIndex = getRandomBoundedInt(ENGLISH_WORDLIST.length);
    let word = ENGLISH_WORDLIST[wordIndex] ?? "";

    if (options.capitalize && word) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    chosenWords.push(word);
  }

  if (options.includeNumber && chosenWords.length > 0) {
    const targetWordIdx = getRandomBoundedInt(chosenWords.length);
    const randomDigit = getRandomBoundedInt(10);
    const existing = chosenWords[targetWordIdx];
    if (existing !== undefined) {
      chosenWords[targetWordIdx] = existing + randomDigit;
    }
  }

  return ok(chosenWords.join(options.wordSeparator));
}
