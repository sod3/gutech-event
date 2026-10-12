import { apiError, authorize, json, sameOrigin } from "@/lib/security";
import { sendPendingMail } from "@/lib/mail";
export async function POST(request: Request) { try { sameOrigin(request); await authorize(["admin"]); return json(await sendPendingMail()); } catch (e) { return apiError(e); } }
