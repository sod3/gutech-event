import { json } from "@/lib/security";

// Retire old clients explicitly; this endpoint never reads or writes a payment.
export async function POST() {
  return json(
    {
      error:
        "Payment uploads have been retired. The organizing team will contact your team leader on WhatsApp.",
    },
    410,
  );
}
