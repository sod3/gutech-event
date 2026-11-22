import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Cookie presence selects a rendering path; it never authorizes a user.
  // The dynamic page still verifies the database session before redirecting.
  if (request.nextUrl.pathname !== "/register") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/register/session-check";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    { source: "/register", has: [{ type: "cookie", key: "bf_session" }] },
  ],
};
