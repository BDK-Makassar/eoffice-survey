import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { updateUser, deleteUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.nama || !body.nip) {
    return NextResponse.json({ error: "Nama dan NIP wajib diisi" }, { status: 400 });
  }
  try {
    const user = await updateUser(Number(params.id), {
      nama: body.nama,
      nip: body.nip,
      jabatan: body.jabatan || "",
    });
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteUser(Number(params.id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
