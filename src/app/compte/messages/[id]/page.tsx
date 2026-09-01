import Link from "next/link";
import { redirect } from "next/navigation";
import { listMessages } from "@/actions/messages";
import { ChatBox } from "@/components/ChatBox";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Conversation" };
export const revalidate = 0;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await listMessages(id);
  if (!data) redirect("/compte/messages");

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
      <div className="h-full">
        <ChatBox
          conversation={{
            id: data.id,
            listing: data.listing,
            otherName: data.otherName,
            otherShop: data.otherShop,
            isBuyer: data.isBuyer,
            sellerPhoneRevealed: data.sellerPhoneRevealed,
          }}
          initialMessages={data.messages}
          priceFmt={formatPrice}
        />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-ink-200 bg-white px-4 py-2 text-xs text-ink-400">
        <Link href="/compte/messages" className="hover:text-brand-700">
          ← Toutes les conversations
        </Link>
        <Link
          href={`/annonce/${data.listing.slug}`}
          className="hover:text-brand-700"
        >
          Voir l'annonce
        </Link>
      </div>
    </div>
  );
}