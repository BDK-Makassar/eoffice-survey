import { NextResponse } from "next/server";
import { getQuestionnaire, getQuestions, listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  console.log(`[api/survey/${params.id}] GET masuk, param mentah = "${params.id}"`);
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      console.log(`[api/survey/${params.id}] param bukan angka, Number() -> NaN`);
    }
    const questionnaire = await getQuestionnaire(id);
    if (!questionnaire || !questionnaire.is_active) {
      console.log(
        `[api/survey/${params.id}] berhenti di sini -> questionnaire ${
          !questionnaire ? "tidak ditemukan" : "ditemukan tapi is_active=false"
        }, users TIDAK ditarik`
      );
      return NextResponse.json({ error: "Kuesioner tidak ditemukan atau belum aktif" }, { status: 404 });
    }
    const [questions, users] = await Promise.all([getQuestions(id), listUsers()]);
    console.log(
      `[api/survey/${params.id}] sukses -> ${questions.length} pertanyaan, ${users.length} user`
    );
    return NextResponse.json({ questionnaire, questions, users });
  } catch (err: any) {
    console.log(`[api/survey/${params.id}] error:`, err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
