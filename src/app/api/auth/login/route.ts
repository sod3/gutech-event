import bcrypt from "bcryptjs";
import { z } from "zod";
import { collections } from "@/lib/db";
import {
  apiError,
  HttpError,
  json,
  newSession,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { emailSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "login", 15);
    const input = z
      .object({ email: emailSchema, password: z.string().min(1).max(128) })
      .parse(await request.json());
    await rateLimit(request, "login-email", 10, 15, input.email);
    const c = await collections();
    const user = await c.users.findOne({ email: input.email, disabled: false });
    const dummy =
      "$2b$12$U5l7PrTSkHYZ7DF9IDYkvutwK9IFeZNJjYGhZLBMCuuSRzBRgdHKu";
    const valid = await bcrypt.compare(
      input.password,
      user?.passwordHash || dummy,
    );
    if (!user || !valid)
      throw new HttpError(401, "Email or password is incorrect.");
    await newSession(user._id);
    return json({
      redirect:
        user.role === "admin"
          ? "/admin"
          : user.role === "judge"
            ? "/judge"
            : "/dashboard",
    });
  } catch (e) {
    return apiError(e);
  }
}
