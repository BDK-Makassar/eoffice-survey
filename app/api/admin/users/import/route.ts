import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { upsertUserByNip } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split("|").map((cell) => cell.trim().replace(/^"+|"+$/g, "").trim()));
}

export async function POST(req: NextRequest) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/users/import] POST masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/users/import] berhenti di sini -> Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const csv: string = body.csv || "";
  if (!csv.trim()) {
    console.log(`[api/admin/users/import] berhenti di sini -> CSV kosong`);
    return NextResponse.json({ error: "File CSV kosong" }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    console.log(`[api/admin/users/import] berhenti di sini -> tidak ada baris data`);
    return NextResponse.json({ error: "Tidak ada baris data" }, { status: 400 });
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const namaIdx = header.indexOf("nama");
  const nipIdx = header.indexOf("nip");
  const jabatanIdx = header.indexOf("jabatan");

  if (namaIdx === -1 || nipIdx === -1) {
    console.log(`[api/admin/users/import] berhenti di sini -> header CSV tidak punya kolom nama/nip`, header);
    return NextResponse.json(
      { error: "Header CSV harus memiliki kolom 'nama' dan 'nip' (jabatan opsional)" },
      { status: 400 }
    );
  }

  const dataRows = rows.slice(1);
  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const nama = row[namaIdx]?.trim();
    const nip = row[nipIdx]?.trim();
    const jabatan = jabatanIdx !== -1 ? row[jabatanIdx]?.trim() || "" : "";
    if (!nama || !nip) {
      errors.push(`Baris ${i + 2}: nama atau NIP kosong, dilewati`);
      continue;
    }
    try {
      await upsertUserByNip({ nama, nip, jabatan });
      created++;
    } catch (err: any) {
      errors.push(`Baris ${i + 2}: ${err.message}`);
    }
  }

  console.log(
    `[api/admin/users/import] sukses -> ${created}/${dataRows.length} diproses, ${errors.length} error`
  );
  return NextResponse.json({ processed: created, total: dataRows.length, errors });
}
