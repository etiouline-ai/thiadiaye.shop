import { prisma } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/auth";
import { sendEmail } from "../src/lib/email";
import {
  createEmailVerificationToken,
  consumeEmailVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "../src/lib/tokens";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const email = "flow@thiadiaye.shop";
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword("OldPass@1234"), name: "Flow" },
  });

  // 1. Email de vérification (driver log -> data/emails/)
  const vToken = await createEmailVerificationToken(user.id);
  await sendEmail({
    to: email,
    subject: "Confirmez votre adresse email",
    html: `<a href="http://localhost:3000/auth/verifier?token=${vToken}">confirmer</a>`,
  });
  const emailsDir = path.join(process.cwd(), "data", "emails");
  const files = fs.readdirSync(emailsDir).filter((f) => f.includes(email.replace(/[^a-z0-9]/gi, "_")));
  console.log("1. Email écrit sur disque:", files.length > 0);

  // 2. Consommer le jeton de vérification
  const uid = await consumeEmailVerificationToken(vToken);
  const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
  console.log("2. Vérification email:", uid === user.id, "| emailVerified défini:", !!refreshed?.emailVerified);

  // 3. Jeton déjà consommé / expiré -> refus
  const again = await consumeEmailVerificationToken(vToken);
  console.log("3. Re-consommation refusée:", again === null);

  // 4. Reset de mot de passe
  const rToken = await createPasswordResetToken(user.id);
  const rid = await consumePasswordResetToken(rToken);
  const newHash = await hashPassword("NewPass@5678");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  const ok = await verifyPassword("NewPass@5678", newHash);
  const bad = await verifyPassword("OldPass@1234", newHash);
  const reuse = await consumePasswordResetToken(rToken);
  console.log("4. Reset: userId récupéré:", rid === user.id, "| nouveau mdp OK:", ok, "| ancien refusé:", !bad, "| jeton non réutilisable:", reuse === null);

  await prisma.user.delete({ where: { id: user.id } });
  console.log("Nettoyé ✓");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
