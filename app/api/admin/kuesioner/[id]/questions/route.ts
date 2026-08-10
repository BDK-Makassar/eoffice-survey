import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { replaceQuestions } from "@/lib/db";
import type { QuestionDef } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const questions: QuestionDef[] = body.questions || [];

  for (const q of questions) {
    if (!q.label || !q.label.trim()) {
      return NextResponse.json({ error: "Semua pertanyaan harus memiliki teks" }, { status: 400 });
    }
  }

  try {
    await replaceQuestions(Number(params.id), questions);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
