import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { listQuestionnaires, createQuestionnaire } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const questionnaires = await listQuestionnaires();
    return NextResponse.json({ questionnaires });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  try {
    const q = await createQuestionnaire({
      title: body.title,
      description: body.description || "",
      is_active: body.is_active ?? true,
    });
    return NextResponse.json({ questionnaire: q });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
