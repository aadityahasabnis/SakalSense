// =============================================
// Notifications Page - View all notifications
// =============================================

import { NotificationsClient } from './NotificationsClient';

// =============================================
// Metadata
// =============================================

export const metadata = {
    title: 'Notifications | SakalSense',
    description: 'View your notifications',
};

// =============================================
// Page Component
// =============================================

export default function NotificationsPage() {
    return <NotificationsClient />;
}
