// src/common/openbaoClient.ts - Thin OpenBao/Vault client wrapper
// @ts-ignore: node-vault lacks TypeScript definitions
import vault from 'node-vault';
import env from '../env';
import logger from '../logger';

type VaultClient = ReturnType<typeof vault>;

let client: VaultClient | null = null;

function buildClient(): VaultClient {
  return vault({
    apiVersion: 'v1',
    endpoint: env.OPENBAO_ADDR,
    token: env.OPENBAO_TOKEN,
    requestOptions: {
      timeout: env.OPENBAO_TIMEOUT_MS,
    },
  });
}

export function isOpenBaoEnabled(): boolean {
  return env.OPENBAO_ENABLED;
}

export function getOpenBaoClient(): VaultClient | null {
  if (!isOpenBaoEnabled()) {
    return null;
  }

  if (!client) {
    try {
      client = buildClient();
    } catch (error: any) {
      logger.error(`❌ Failed to initialize OpenBao client: ${error.message}`);
      return null;
    }
  }

  return client;
}

export async function readSecret(path: string): Promise<any> {
  const vaultClient = getOpenBaoClient();
  if (!vaultClient) {
    throw new Error('OpenBao client is not configured.');
  }

  return vaultClient.read(path);
}
