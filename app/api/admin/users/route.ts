import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { listUsers, createUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/users] GET masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/users] berhenti di sini -> Unauthorized, users TIDAK ditarik`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const users = await listUsers();
    console.log(`[api/admin/users] sukses -> ${users.length} user`);
    return NextResponse.json({ users });
  } catch (err: any) {
    console.log(`[api/admin/users] error:`, err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/users] POST masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/users] berhenti di sini -> Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.nama || !body.nip) {
    console.log(`[api/admin/users] berhenti di sini -> nama/nip kosong`);
    return NextResponse.json({ error: "Nama dan NIP wajib diisi" }, { status: 400 });
  }
  try {
    const user = await createUser({ nama: body.nama, nip: body.nip, jabatan: body.jabatan || "" });
    console.log(`[api/admin/users] sukses buat user ->`, user);
    return NextResponse.json({ user });
  } catch (err: any) {
    console.log(`[api/admin/users] error:`, err.message, err.stack);
    if (String(err.message).includes("duplicate key")) {
      return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
