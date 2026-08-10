import { NextRequest, NextResponse } from "next/server";
import { submitResponse, getQuestionnaire } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const questionnaireId = Number(params.id);
  const userId = Number(body.user_id);
  const answers = body.answers || [];

  if (!userId) {
    return NextResponse.json({ error: "Identitas pengguna wajib dipilih" }, { status: 400 });
  }

  try {
    const questionnaire = await getQuestionnaire(questionnaireId);
    if (!questionnaire || !questionnaire.is_active) {
      return NextResponse.json({ error: "Kuesioner tidak aktif" }, { status: 404 });
    }
    await submitResponse(questionnaireId, userId, answers);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === "ALREADY_SUBMITTED") {
      return NextResponse.json(
        { error: "Anda sudah pernah mengisi kuesioner ini." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
