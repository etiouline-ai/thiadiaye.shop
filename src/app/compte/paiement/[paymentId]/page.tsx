import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MockConfirmPayment } from "@/components/MockConfirmPayment";

export const metadata = { title: "Paiement" };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { listing: { select: { title: true, slug: true } } },
  });

  if (!payment || payment.userId !== session.id) notFound();

  const isMock = payment.provider === "MOCK";
  const isPending = payment.status === "PENDING";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">Paiement</h1>
        <div className="mt-4 space-y-2 text-sm text-ink-600">
          <div className="flex justify-between">
            <span>Objet</span>
            <span className="font-medium text-ink-800">
              {payment.listing?.title ?? "Mise en avant"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Moyen</span>
            <span className="font-medium text-ink-800">
              {payment.method.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Montant</span>
            <span className="font-bold text-brand-700">
              {payment.amount.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span>Référence</span>
            <span className="font-mono text-xs">
              {String((payment.metadata as { reference?: string } | null)?.reference ?? payment.id.slice(0, 10))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Statut</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                payment.status === "SUCCESS"
                  ? "bg-brand-100 text-brand-700"
                  : payment.status === "FAILED"
                    ? "bg-red-100 text-red-700"
                    : "bg-ink-100 text-ink-600"
              }`}
            >
              {payment.status === "SUCCESS"
                ? "Payé ✓"
                : payment.status === "FAILED"
                  ? "Échoué"
                  : "En attente"}
            </span>
          </div>
        </div>

        {payment.status === "SUCCESS" && (
          <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            ✅ Votre annonce est maintenant mise en avant. Elle apparaît dans la
            section « À la une ».
          </div>
        )}

        {isPending && isMock && (
          <div className="mt-5">
            <p className="mb-3 rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              Mode de démonstration : aucun vrai paiement n'est effectué. Cliquez
              pour simuler le paiement mobile money.
            </p>
            <MockConfirmPayment paymentId={payment.id} />
          </div>
        )}

        {isPending && !isMock && (
          <div className="mt-5 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
            💳 Vérifiez votre téléphone : vous recevrez une demande de
            confirmation {payment.method.replace("_", " ")}. Validez-la pour
            finaliser le paiement.
          </div>
        )}

        <Link
          href="/compte"
          className="mt-5 block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-700"
        >
          Retour à mon compte
        </Link>
      </div>
    </div>
  );
}
