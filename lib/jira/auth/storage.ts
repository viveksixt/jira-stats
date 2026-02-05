import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import type { AuthMethod, Credentials } from './types';

export async function saveConnection(
  jiraHost: string,
  authMethod: AuthMethod,
  credentials: Credentials,
  userEmail: string
) {
  // Encrypt credentials
  const encryptedCredentials = encrypt(JSON.stringify(credentials));

  // Deactivate any existing connections
  await prisma.jiraConnection.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new connection
  const connection = await prisma.jiraConnection.create({
    data: {
      jiraHost,
      authMethod,
      encryptedCredentials,
      isActive: true,
      lastTestedAt: new Date(),
      lastTestedBy: userEmail,
    },
  });

  return connection;
}

export async function getActiveConnection() {
  const connection = await prisma.jiraConnection.findFirst({
    where: { isActive: true },
  });

  if (!connection) {
    return null;
  }

  // Decrypt credentials
  const credentials = JSON.parse(decrypt(connection.encryptedCredentials));

  return {
    id: connection.id,
    jiraHost: connection.jiraHost,
    authMethod: connection.authMethod as AuthMethod,
    credentials,
    lastTestedAt: connection.lastTestedAt,
    lastTestedBy: connection.lastTestedBy,
  };
}

export async function updateConnection(
  id: string,
  jiraHost: string,
  authMethod: AuthMethod,
  credentials: Credentials,
  userEmail: string
) {
  const encryptedCredentials = encrypt(JSON.stringify(credentials));

  const connection = await prisma.jiraConnection.update({
    where: { id },
    data: {
      jiraHost,
      authMethod,
      encryptedCredentials,
      lastTestedAt: new Date(),
      lastTestedBy: userEmail,
    },
  });

  return connection;
}

export async function deleteConnection(id: string) {
  await prisma.jiraConnection.delete({
    where: { id },
  });
}
