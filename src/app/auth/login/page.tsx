import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/compte");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink-900">Connexion</h1>
      <p className="mb-6 text-sm text-ink-500">
        Accédez à votre compte pour gérer vos annonces.
      </p>
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
