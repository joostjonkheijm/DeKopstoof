// Test helpers: generate an RSA key pair, a certs document and signed JWTs.
const enc = new TextEncoder();

export const b64u = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export async function makeKeyAndCerts(kid = "kid1") {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    privateKey: pair.privateKey,
    kid,
    certs: { keys: [{ kty: "RSA", alg: "RS256", use: "sig", kid, n: jwk.n, e: jwk.e }] },
  };
}

// Sign header.payload with RS256; header and payload are plain objects.
export async function signJwt(header, payload, privateKey) {
  const input = `${b64u(enc.encode(JSON.stringify(header)))}.${b64u(enc.encode(JSON.stringify(payload)))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, enc.encode(input));
  return `${input}.${b64u(new Uint8Array(sig))}`;
}
