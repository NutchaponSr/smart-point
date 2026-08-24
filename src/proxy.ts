import createMiddleware from "next-intl/middleware";

import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const initMiddleware = createMiddleware(routing);

const PROTECTED_PREFIX = ["/", "/dashboard", "/rewards", "/leaderboard", "/events", "/transactions", "/purchases", "/checkout"];
const PUBLIC_PREFIX = ["/auth"];

function matchPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale =
    pathname.match(/^\/(en|th)(?=\/|$)/)?.[1] ?? routing.defaultLocale;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|th)/, "") || "/";
  const withLocale = (path: string) =>
    `/${locale}${path === "/" ? "" : path}`;

  const isProtected = matchPrefix(pathnameWithoutLocale, PROTECTED_PREFIX);
  const isPublic = matchPrefix(pathnameWithoutLocale, PUBLIC_PREFIX);

  const isSignedIn = !!getSessionCookie(req);

  if (isProtected && !isSignedIn && !isPublic) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(
        `${withLocale("/auth/sign-in")}?callbackUrl=${callbackUrl}`,
        req.url,
      ),
    );
  }

  if (isPublic && isSignedIn) {
    return NextResponse.redirect(new URL(withLocale("/"), req.url));
  }

  return initMiddleware(req);
}

export const config = {
  matcher: [
    // Skip Next internals, API, and static files in /public (e.g. /chick.png)
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)",
  ],
};
