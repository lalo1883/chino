// Matches the default Better Auth 1.7 password configuration used by this app.
export const legacyHashOptions = {
  hash: { algorithm: 'STANDARD_SCRYPT', memoryCost: 16384, blockSize: 16, parallelization: 1, derivedKeyLength: 64 },
};

export function legacyFirebaseUser(row, accounts = []) {
  const credential = accounts.find(account => account.providerId === 'credential');
  const user = {
    uid: row.id, email: row.email, emailVerified: Boolean(row.emailVerified),
    ...(row.name ? { displayName: row.name } : {}),
    ...(row.image ? { photoURL: row.image } : {}),
  };
  if (credential?.password) {
    const match = /^([a-f0-9]{32}):([a-f0-9]{128})$/i.exec(credential.password);
    if (!match) throw new Error('Unsupported legacy password hash; migration stopped before losing credentials.');
    // Better Auth passes the hex salt STRING into scrypt, not hex-decoded bytes.
    user.passwordSalt = Buffer.from(match[1], 'utf8');
    user.passwordHash = Buffer.from(match[2], 'hex');
  }
  const google = accounts.find(account => account.providerId === 'google');
  if (google) user.providerData = [{ providerId: 'google.com', uid: google.accountId, email: row.email }];
  return user;
}
