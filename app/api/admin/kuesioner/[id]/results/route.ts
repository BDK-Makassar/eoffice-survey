import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { getCompletionStatus, getFullResults } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authorized = isAuthorized(req);
  console.log(`[api/admin/kuesioner/${params.id}/results] GET masuk, authorized=${authorized}`);
  if (!authorized) {
    console.log(`[api/admin/kuesioner/${params.id}/results] berhenti di sini -> Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const id = Number(params.id);
    const completion = await getCompletionStatus(id);
    const results = await getFullResults(id);
    console.log(
      `[api/admin/kuesioner/${params.id}/results] sukses -> totalUsers=${completion.totalUsers}, totalResponded=${completion.totalResponded}, results=${results.length}`
    );
    return NextResponse.json({ completion, results });
  } catch (err: any) {
    console.log(`[api/admin/kuesioner/${params.id}/results] error:`, err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
