import { encodeCoseEC2PublicKey } from "@/core/cbor-utils.ts";

export interface CoseAlgorithmStrategy {
  readonly alg: number;
  readonly name: string;
  readonly keyType: string;
  readonly curveName?: string;
  readonly webCryptoAlg: RsaHashedImportParams | EcKeyImportParams | AlgorithmIdentifier;
  encodePublicKey(x: Uint8Array, y: Uint8Array): Uint8Array;
}

export const es256CoseStrategy: CoseAlgorithmStrategy = {
  alg: -7,
  name: "ES256",
  keyType: "ECDSA",
  curveName: "P-256",
  webCryptoAlg: { name: "ECDSA", namedCurve: "P-256" },
  encodePublicKey(x: Uint8Array, y: Uint8Array): Uint8Array {
    return encodeCoseEC2PublicKey(x, y);
  },
};

export const coseStrategyRegistry: Record<number, CoseAlgorithmStrategy> = {
  [-7]: es256CoseStrategy,
};

export function getCoseAlgorithmStrategy(alg: number): CoseAlgorithmStrategy {
  return coseStrategyRegistry[alg] || es256CoseStrategy;
}
