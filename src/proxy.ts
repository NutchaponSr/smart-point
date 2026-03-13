import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIX = ["/"];
const PUBLIC_PREFIX = ["/auth"];

function matchPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const isProtected = matchPrefix(pathname, PROTECTED_PREFIX);
  const isPublic = matchPrefix(pathname, PUBLIC_PREFIX);

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  const isSignedIn = !!getSessionCookie(req);
  
  if (isProtected && !isSignedIn) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/sign-in?callbackUrl=${callbackUrl}`, req.url));
  }

  if (isPublic && isSignedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/auth/:path*",
  ],
}