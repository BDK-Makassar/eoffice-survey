import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import {
  getQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  getQuestions,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const questionnaire = await getQuestionnaire(Number(params.id));
    if (!questionnaire) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const questions = await getQuestions(Number(params.id));
    return NextResponse.json({ questionnaire, questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  try {
    const q = await updateQuestionnaire(Number(params.id), {
      title: body.title,
      description: body.description || "",
      is_active: !!body.is_active,
    });
    return NextResponse.json({ questionnaire: q });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteQuestionnaire(Number(params.id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
