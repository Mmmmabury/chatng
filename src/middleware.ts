import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { log } from "@/helper/logger";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/api")) {
        log.info(request.method + " " + request.nextUrl.pathname);
    }
}
