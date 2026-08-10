import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { getRawExportRows } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questions, responses, answersByResponse } = await getRawExportRows(Number(params.id));

  const headers = ["nama", "nip", "jabatan", "submitted_at", ...questions.map((q) => q.label)];
  const lines = [headers.map(csvEscape).join(",")];

  for (const r of responses) {
    const row = [r.nama, r.nip, r.jabatan, r.submitted_at];
    for (const q of questions) {
      row.push(answersByResponse[r.response_id]?.[q.id!] ?? "");
    }
    lines.push(row.map(csvEscape).join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hasil-kuesioner-${params.id}.csv"`,
    },
  });
}
