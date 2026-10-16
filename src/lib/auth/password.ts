import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// A real bcrypt hash of a random string. Comparing against it when the email does not
// exist makes "unknown email" take as long as "wrong password", so response time
// doesn't reveal which emails are registered.
const DUMMY_HASH = "$2b$10$ClvGAp2cbQcNC2.1AvV61O3JG3Ik.p69JNiaQRZSVJPrvX2w9NXii";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string | null | undefined,
): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
