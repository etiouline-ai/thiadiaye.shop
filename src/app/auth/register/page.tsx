import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/compte");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink-900">
        Créer un compte gratuit
      </h1>
      <p className="mb-6 text-sm text-ink-500">
        Publiez des annonces et gérez-les facilement.
      </p>
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
