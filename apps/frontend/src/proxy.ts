import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, type STAKEHOLDER } from '@sakalsense/core';

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes - No authentication required
// All other routes are protected by default
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ['/login', '/login/admin', '/login/administrator', '/register', '/register/admin'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

type StakeholderKey = keyof typeof STAKEHOLDER;

const getStakeholderFromPath = (pathname: string): StakeholderKey => {
    if (pathname.startsWith('/administrator') || pathname === '/login/administrator') {
        return 'ADMINISTRATOR';
    }
    if (pathname.startsWith('/admin') || pathname === '/login/admin' || pathname === '/register/admin') {
        return 'ADMIN';
    }
    return 'USER';
};

const getLoginPath = (stakeholder: StakeholderKey): string => {
    switch (stakeholder) {
        case 'ADMINISTRATOR':
            return '/login/administrator';
        case 'ADMIN':
            return '/login/admin';
        default:
            return '/login';
    }
};

const getDashboardPath = (stakeholder: StakeholderKey): string => {
    switch (stakeholder) {
        case 'ADMINISTRATOR':
            return '/administrator';
        case 'ADMIN':
            return '/admin';
        default:
            return '/';
    }
};

const hasValidToken = (request: NextRequest, stakeholder: StakeholderKey): boolean => {
    const cookieName = AUTH_COOKIE[stakeholder];
    return !!request.cookies.get(cookieName)?.value;
};

const isPublicRoute = (pathname: string): boolean => {
    return PUBLIC_ROUTES.some((route) => pathname === route);
};

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Function
// ─────────────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip proxy for static assets and API routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    const stakeholder = getStakeholderFromPath(pathname);
    const isAuthenticated = hasValidToken(request, stakeholder);
    const isPublic = isPublicRoute(pathname);

    // Public route + authenticated → redirect to dashboard
    if (isPublic && isAuthenticated) {
        return NextResponse.redirect(new URL(getDashboardPath(stakeholder), request.url));
    }

    // Protected route + NOT authenticated → redirect to login
    if (!isPublic && !isAuthenticated) {
        return NextResponse.redirect(new URL(getLoginPath(stakeholder), request.url));
    }

    return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
