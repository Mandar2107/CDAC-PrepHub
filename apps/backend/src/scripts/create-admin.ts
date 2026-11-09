import * as argon2 from 'argon2';
import dataSource from '../database/data-source';
import { User, UserRole } from '../users/user.entity';

async function createAdmin(): Promise<void> {
  const name = process.env['ADMIN_NAME']?.trim();
  const email = process.env['ADMIN_EMAIL']?.trim().toLowerCase();
  const password = process.env['ADMIN_INITIAL_PASSWORD'];
  if (!name || !email || !password || password.length < 16) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_INITIAL_PASSWORD (at least 16 characters) before running this command.');
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    if (await users.findOne({ where: { email } })) throw new Error('An account with that email already exists. No changes were made.');
    const user = users.create({ name, email, passwordHash: await argon2.hash(password), role: UserRole.Admin, refreshTokenHash: null });
    await users.save(user);
    process.stdout.write(`Created administrator account for ${email}. Sign in through the web app; public registration cannot create administrator accounts.\n`);
  } finally {
    await dataSource.destroy();
  }
}

void createAdmin().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Administrator setup failed.'}\n`);
  process.exitCode = 1;
  if (dataSource.isInitialized) void dataSource.destroy();
});
