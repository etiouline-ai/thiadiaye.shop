import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const EMAIL_DRIVER = process.env.EMAIL_DRIVER ?? "log";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "THIADIAYE.SHOP <no-reply@thiadiaye.shop>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function logEmail(email: SendEmailInput): void {
  const dir = path.join(process.cwd(), "data", "emails");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${email.to.replace(/[^a-z0-9]/gi, "_")}.txt`);
  fs.writeFileSync(
    file,
    `À: ${email.to}\nSujet: ${email.subject}\n\n${email.text ?? email.html.replace(/<[^>]+>/g, " ")}\n\nHTML:\n${email.html}\n`,
  );
  console.log(`[email:log] ${email.subject} -> ${email.to} (${file})`);
}

export async function sendEmail(email: SendEmailInput): Promise<boolean> {
  if (EMAIL_DRIVER === "smtp") {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host) throw new Error("SMTP non configuré (SMTP_HOST)");

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
    await transport.sendMail({
      from: EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return true;
  }

  logEmail(email);
  return true;
}
