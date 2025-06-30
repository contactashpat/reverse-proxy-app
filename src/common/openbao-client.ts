// @ts-ignore: No type definitions for node-vault
import vault from 'node-vault';

const openbaoAddress = process.env.OPENBAO_ADDR || 'http://localhost:8200';
const openbaoToken = process.env.OPENBAO_TOKEN || '';

const client = vault({
  apiVersion: 'v1',
  endpoint: openbaoAddress,
  token: openbaoToken,
});

export async function getSecret(path: string): Promise<any> {
  try {
    const result = await client.read(path);
    return result.data;
  } catch (err) {
    console.error('Error fetching secret from OpenBao:', err);
    throw err;
  }
} 