import assert from 'assert';
import { SecretsManager } from 'aws-sdk';
import { JWT_SECRET_NAME, JWT_SECRET_REGION } from '../constants';

const CACHE = new Map<string, string>();

export async function getSecret(secretName: string, region: string): Promise<string> {
  if (CACHE.has(JWT_SECRET_NAME)) {
    return CACHE.get(JWT_SECRET_NAME) || '';
  }

  assert(secretName, 'Secret name is not set.');
  assert(region, 'Secret region is not set.');

  const sm = new SecretsManager({ region });
  const { SecretString } = await sm.getSecretValue({ SecretId: secretName }).promise();

  assert(typeof SecretString === 'string', 'Secret string is empty.');

  CACHE.set(JWT_SECRET_NAME, SecretString);

  return SecretString;
}
