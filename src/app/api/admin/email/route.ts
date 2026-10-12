import { apiError, authorize, json, sameOrigin } from "@/lib/security";
import { sendPendingMail } from "@/lib/mail";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await authorize(["admin"]);
    return json(await sendPendingMail(true));
  } catch (e) {
    return apiError(e);
  }
}
