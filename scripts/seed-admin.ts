// Creates or updates an admin account from CLI arguments:
// npx tsx scripts/seed-admin.ts <email> <password>
import "dotenv/config";
import { hashPassword } from "../src/lib/auth-core";
import { db } from "../src/lib/db";
import { isValidEmail, MIN_PASSWORD_LENGTH, normalizeEmail } from "../src/lib/validation";

async function main() {
  const [, , rawEmail, password] = process.argv;
  if (!rawEmail || !password) {
    console.error("Pemakaian: npx tsx scripts/seed-admin.ts <email> <password>");
    process.exit(1);
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    console.error("Format email tidak valid.");
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash },
    create: { email, passwordHash, role: "admin" },
    select: { id: true, email: true, role: true },
  });

  console.log(`Akun admin siap: ${user.email} (role=${user.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
