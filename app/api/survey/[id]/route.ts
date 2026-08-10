import { NextResponse } from "next/server";
import { getQuestionnaire, getQuestions, listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const questionnaire = await getQuestionnaire(id);
    if (!questionnaire || !questionnaire.is_active) {
      return NextResponse.json({ error: "Kuesioner tidak ditemukan atau belum aktif" }, { status: 404 });
    }
    const [questions, users] = await Promise.all([getQuestions(id), listUsers()]);
    return NextResponse.json({ questionnaire, questions, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
