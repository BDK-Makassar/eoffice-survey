import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { getCompletionStatus, getFullResults } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = Number(params.id);
    const [completion, results] = await Promise.all([
      getCompletionStatus(id),
      getFullResults(id),
    ]);
    return NextResponse.json({ completion, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
