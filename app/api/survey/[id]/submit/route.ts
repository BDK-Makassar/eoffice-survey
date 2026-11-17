import { NextRequest, NextResponse } from "next/server";
import { submitResponse, getQuestionnaire, getQuestions } from "@/lib/db";
import { PUBLIC_CATEGORIES } from "@/lib/types";
import type { AnswerInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const questionnaireId = Number(params.id);
  const userId = Number(body.user_id) || null;

  try {
    const questionnaire = await getQuestionnaire(questionnaireId);
    if (!questionnaire || !questionnaire.is_active) {
      return NextResponse.json({ error: "Kuesioner tidak aktif" }, { status: 404 });
    }

    // Responden umum hanya untuk kuesioner bermode publik.
    let publik;
    if (!userId) {
      if (!questionnaire.public_mode) {
        return NextResponse.json({ error: "Identitas pengguna wajib dipilih" }, { status: 400 });
      }
      publik = {
        nama: str(body.respondent?.nama, 100),
        kategori: str(body.respondent?.kategori, 50),
        instansi: str(body.respondent?.instansi, 150),
      };
      if (!publik.nama || !PUBLIC_CATEGORIES.includes(publik.kategori)) {
        return NextResponse.json({ error: "Nama dan kategori responden wajib diisi" }, { status: 400 });
      }
    }

    // Hanya simpan jawaban untuk pertanyaan milik kuesioner ini.
    const questionIds = new Set((await getQuestions(questionnaireId)).map((q) => q.id));
    const answers: AnswerInput[] = (Array.isArray(body.answers) ? body.answers : [])
      .filter((a: any) => questionIds.has(Number(a?.question_id)))
      .map((a: any) => ({ question_id: Number(a.question_id), value: str(a.value, 5000) }));

    await submitResponse(questionnaireId, userId, answers, publik);
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
