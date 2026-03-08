/**
 * Ensures runtimes without crypto.randomUUID can still initialize TanStack DB collections.
 * TanStack DB uses randomUUID internally during collection construction.
 */

const byteToHex = (byte: number): string => byte.toString(16).padStart(2, "0");

const formatUuidV4 = (bytes: Uint8Array): string => {
  // RFC 4122 version/variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byteToHex);

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
};

const randomUuidFromCrypto = (): string => {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return formatUuidV4(bytes);
};

const randomUuidFromMath = (): string => {
  const bytes = new Uint8Array(16);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  return formatUuidV4(bytes);
};

const randomUUID = (): string => {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    return randomUuidFromCrypto();
  }

  return randomUuidFromMath();
};

const installRandomUuidPolyfill = (): void => {
  const cryptoObject = globalThis.crypto;

  if (typeof cryptoObject?.randomUUID === "function") {
    return;
  }

  if (cryptoObject) {
    Object.defineProperty(cryptoObject, "randomUUID", {
      value: randomUUID,
      configurable: true,
      writable: true,
    });
    return;
  }

  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID,
    },
    configurable: true,
    writable: true,
  });
};

installRandomUuidPolyfill();

export {};
