// middleware.ts — CSRF protection and secure headers for all API routes
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    if (pathname.startsWith("/api/")) {
        // Enforce secure headers
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        const secFetchSite = request.headers.get("sec-fetch-site");

        // CSRF Protection: Only allow same-origin requests
        if (secFetchSite && secFetchSite !== "same-origin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }
    }

    return response;
}

export const config = {
    matcher: ["/api/:path*"],
};
