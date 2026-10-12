import { apiError, json, logout, sameOrigin } from "@/lib/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await logout();
    return json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
