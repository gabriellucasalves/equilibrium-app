export const CryptoDigestAlgorithm = {
  SHA256: 'SHA-256',
};

export async function digestStringAsync(
  _algorithm: string,
  data: string,
): Promise<string> {
  // Determinístico para testes (não é SHA-256 real).
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
  }
  return `mock-${hash.toString(16)}`;
}
