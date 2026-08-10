import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { updateUser, deleteUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/users/${params.id}] PUT masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/users/${params.id}] berhenti di sini -> Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.nama || !body.nip) {
    console.log(`[api/admin/users/${params.id}] berhenti di sini -> nama/nip kosong`);
    return NextResponse.json({ error: "Nama dan NIP wajib diisi" }, { status: 400 });
  }
  try {
    const user = await updateUser(Number(params.id), {
      nama: body.nama,
      nip: body.nip,
      jabatan: body.jabatan || "",
    });
    console.log(`[api/admin/users/${params.id}] sukses update ->`, user);
    return NextResponse.json({ user });
  } catch (err: any) {
    console.log(`[api/admin/users/${params.id}] error:`, err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/users/${params.id}] DELETE masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/users/${params.id}] berhenti di sini -> Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await deleteUser(Number(params.id));
    console.log(`[api/admin/users/${params.id}] sukses hapus`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.log(`[api/admin/users/${params.id}] error:`, err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
