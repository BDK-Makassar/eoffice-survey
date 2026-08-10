import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { listUsers, createUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.nama || !body.nip) {
    return NextResponse.json({ error: "Nama dan NIP wajib diisi" }, { status: 400 });
  }
  try {
    const user = await createUser({ nama: body.nama, nip: body.nip, jabatan: body.jabatan || "" });
    return NextResponse.json({ user });
  } catch (err: any) {
    if (String(err.message).includes("duplicate key")) {
      return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
