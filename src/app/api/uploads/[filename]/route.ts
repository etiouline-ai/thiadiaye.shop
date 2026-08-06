import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/storage";

export const dynamic = "force-static";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const file = getFile(filename);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
