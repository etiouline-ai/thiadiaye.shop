"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { sendMessage, revealSellerPhone } from "@/actions/messages";

type Message = {
  id: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  mine: boolean;
};

type ConversationMeta = {
  id: string;
  listing: { id: string; slug: string; title: string; price: number | null };
  otherName: string;
  otherShop: { slug: string; name: string; logoUrl: string | null } | null;
  isBuyer: boolean;
  sellerPhoneRevealed: boolean;
};

function fmtTime(d: Date): string {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatBox({
  conversation,
  initialMessages,
  priceFmt,
}: {
  conversation: ConversationMeta;
  initialMessages: Message[];
  priceFmt: (p: number | null) => string;
}) {
  const router = useRouter();
  const [messages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(conversation.sellerPhoneRevealed);
  const [phone, setPhone] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollBottom();
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [scrollBottom, router]);

  async function doSend() {
    const trimmed = body.trim();
    if ((!trimmed && !selectedFile) || sending) return;
    setSending(true);
    setError(null);
    const fd = new FormData();
    fd.set("body", trimmed);
    if (selectedFile) fd.set("image", selectedFile);
    try {
      await sendMessage(conversation.id, fd);
      setBody("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
      scrollBottom();
    } catch {
      setError("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  async function doReveal() {
    const res = await revealSellerPhone(conversation.id);
    setRevealed(true);
    setPhone(res.phone ?? null);
  }

  const phoneTarget = phone ? phone.replace(/[^0-9]/g, "") : "";
  const waLink = `https://wa.me/${phoneTarget}?text=${encodeURIComponent(
    `Bonjour, je vous contacte au sujet de « ${conversation.listing.title} » sur THIADIAYE.SHOP`,
  )}`;

  return (
    <div className="flex h-full flex-col">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-ink-200 bg-white p-4">
        <Link
          href={`/annonce/${conversation.listing.slug}`}
          className="min-w-0 flex-1"
        >
          <div className="line-clamp-1 text-sm font-semibold text-ink-900">
            {conversation.otherName}
            {" · "}
            {conversation.listing.title}
          </div>
          <div className="text-xs text-ink-500">
            {priceFmt(conversation.listing.price)}
          </div>
        </Link>
        {!revealed && (
          <button
            onClick={doReveal}
            className="shrink-0 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
          >
            🔓 Voir le numéro
          </button>
        )}
      </div>

      {/* Fil */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-ink-400">
            Aucun message pour l'instant.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                m.mine
                  ? "rounded-br-sm bg-brand-600 text-white"
                  : "rounded-bl-sm bg-white text-ink-800"
              }`}
            >
              {m.imageUrl && (
                <Image
                  src={m.imageUrl}
                  alt="Photo envoyée"
                  width={360}
                  height={270}
                  className="mb-1.5 w-40 rounded-lg object-cover"
                />
              )}
              {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
              <div
                className={`mt-1 text-right text-[10px] ${
                  m.mine ? "text-white/70" : "text-ink-400"
                }`}
              >
                {fmtTime(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Zone contact si numéro révélé */}
      {revealed && phoneTarget && (
        <div className="flex gap-2 border-t border-ink-200 bg-white px-4 py-3">
          <a
            href={`tel:+${phoneTarget}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            📞 {phone}
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            💬 WhatsApp
          </a>
        </div>
      )}

      {/* Saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void doSend();
        }}
        className="flex items-end gap-2 border-t border-ink-200 bg-white p-3"
      >
        {selectedFile && (
          <div className="mb-1 flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 text-xs text-ink-500">
            🖼️ {selectedFile.name}
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-ink-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded-lg border border-ink-300 px-3 py-2.5 text-lg hover:bg-ink-50"
          title="Envoyer une photo"
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écris un message…"
          rows={1}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={sending || (!body.trim() && !selectedFile)}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
      {error && <p className="px-4 py-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}