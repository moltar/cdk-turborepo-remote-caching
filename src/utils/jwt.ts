import { createSecretKey } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

function secretKey (secret: string) {
  return createSecretKey(Buffer.from(secret, 'ascii'));
}

export async function sign(secret: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secretKey(secret));
}

export async function verify(secret: string, jwt: string) {
  return jwtVerify(jwt, secretKey(secret));
}
