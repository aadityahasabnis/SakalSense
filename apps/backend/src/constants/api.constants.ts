// API constants - Configuration for API calls
// Used by both frontend and backend for consistent API behavior

export const API_CONFIG = {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second
} as const;

// API endpoints - Centralized endpoint definitions
// Add new endpoints here as the app grows
export const API_ENDPOINTS = {
    // Health
    health: '/health',

    // Auth
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',

    // User
    user: '/user',
    userProfile: '/user/profile',
} as const;

// Extract type from API_ENDPOINTS values
export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
