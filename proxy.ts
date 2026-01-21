import { NextResponse, NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(req: NextRequest) {
    const session = await auth();
    const url = new URL(req.url);

    if (session && 
        (url.pathname === '/'
            || url.pathname.startsWith('/signin')
        )
    ) {
        return NextResponse.redirect(new URL('/home', req.url))
    }

    if (!session &&
        (url.pathname.startsWith('/home')
            || url.pathname.startsWith('/schedule')
            || url.pathname.startsWith('/profile')
            || url.pathname.startsWith('/meetings/:path*')
        )
    ) {
        return NextResponse.redirect(new URL('/signin', req.url))
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/home",
        "/schedule",
        "/profile",
        "/meetings/:path*",
        "/signin"
    ]
}