import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAuthorized } from "@/lib/adminAuth";
import { getQuestionnaire, getRawExportRows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const questionnaire = await getQuestionnaire(id);
  const { questions, responses, answersByResponse } = await getRawExportRows(id);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kuesioner e-Office BDK Makassar";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Hasil", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nama", key: "nama", width: 24 },
    { header: "NIP", key: "nip", width: 20 },
    { header: "Jabatan", key: "jabatan", width: 22 },
    { header: "Waktu Submit", key: "submitted_at", width: 20 },
    ...questions.map((q, i) => ({ header: q.label, key: `q${q.id ?? i}`, width: 28 })),
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  headerRow.alignment = { vertical: "middle" };

  for (const r of responses) {
    const rowData: Record<string, unknown> = {
      nama: r.nama,
      nip: r.nip,
      jabatan: r.jabatan,
      submitted_at: r.submitted_at ? new Date(r.submitted_at) : "",
    };
    for (const q of questions) {
      let value = answersByResponse[r.response_id]?.[q.id!] ?? "";
      if (q.type === "multi_choice" && value) value = value.split("||").filter(Boolean).join(", ");
      rowData[`q${q.id ?? ""}`] = value;
    }
    sheet.addRow(rowData);
  }

  sheet.getColumn("submitted_at").numFmt = "yyyy-mm-dd hh:mm:ss";

  const buffer = await workbook.xlsx.writeBuffer();
  const safeTitle = (questionnaire?.title || `kuesioner-${id}`)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hasil-${safeTitle || id}.xlsx"`,
    },
  });
}
