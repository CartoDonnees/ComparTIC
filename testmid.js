import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function middleware(request) {
  const token = request.cookies.get("token")?.value;

  // Routes protégées
  const protectedPaths = ["/dashboard", "/profile", "/admin"];

  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Aucun token
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    jwt.verify(token, JWT_SECRET);

    return NextResponse.next();
  } catch (error) {
    console.error("JWT invalide :", error.message);

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};