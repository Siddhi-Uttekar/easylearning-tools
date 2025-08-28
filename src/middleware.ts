import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log("Token:", token);

    // If user is authenticated and tries to access login page, redirect to dashboard
    // if (token && pathname === "/login") {
    //   return NextResponse.redirect(new URL("/dashboard", req.url));
    // }

    // If user is not authenticated and tries to access protected routes, redirect to login
    if (!token && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard"],
};
