import { NextResponse } from "next/server";
import { listActiveQuestionnaires } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questionnaires = await listActiveQuestionnaires();
    return NextResponse.json({ questionnaires });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
