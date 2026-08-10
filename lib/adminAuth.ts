import { NextRequest } from "next/server";

export function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  const expected = process.env.ADMIN_KEY;
  if (!expected) return true; // belum diset -> jangan kunci akses saat development
  return key === expected;
}
