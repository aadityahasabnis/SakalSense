// =============================================
// Leaderboard Page - Server Component
// =============================================

import type { Metadata } from 'next';

import { LeaderboardClient } from './LeaderboardClient';

export const metadata: Metadata = {
    title: 'Leaderboard | SakalSense',
    description: 'See top learners and compete for the top spots on the leaderboard',
};

export default function LeaderboardPage() {
    return <LeaderboardClient />;
}
