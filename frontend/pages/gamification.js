/**
 * Gamification Page
 * Badges, achievements, and leaderboard
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const BADGES = [
    { id: 'first_feedback', name: 'First Steps', icon: '🎯', description: 'Submit your first feedback' },
    { id: 'feedback_master', name: 'Feedback Master', icon: '📝', description: 'Submit 50 feedbacks' },
    { id: 'quality_contributor', name: 'Quality Contributor', icon: '⭐', description: '10 high-quality feedbacks' },
    { id: 'consistent_user', name: 'Consistency Champion', icon: '🔥', description: '30 consecutive days active' },
    { id: 'community_helper', name: 'Community Helper', icon: '🤝', description: 'Help verify 20 feedbacks' },
    { id: 'trend_setter', name: 'Trend Setter', icon: '🚀', description: 'Start a trending topic' },
    { id: 'impact_maker', name: 'Impact Maker', icon: '💡', description: 'Feedback implemented' },
    { id: 'privacy_champion', name: 'Privacy Champion', icon: '🔒', description: 'Use privacy features' },
];

export default function Gamification() {
    const { account, contracts } = useWeb3();
    const [userBadges, setUserBadges] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account && contracts.gamification) {
            loadGamificationData();
        }
    }, [account, contracts]);

    const loadGamificationData = async () => {
        try {
            setLoading(true);

            // Load user stats
            const userStats = await contracts.gamification.getUserStats(account);
            setStats({
                feedbacks: parseInt(userStats.feedbacks.toString()),
                qualityFeedbacks: parseInt(userStats.qualityFeedbacks.toString()),
                badgeCount: parseInt(userStats.badgeCount.toString()),
                consecutiveDays: parseInt(userStats.consecutiveDays.toString()),
            });

            // Load user badges
            const achievements = await contracts.gamification.getUserAchievements(account);
            setUserBadges(achievements);

            // Load leaderboard
            const leaderboardData = await contracts.gamification.getLeaderboard(10);
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error loading gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Achievements & Leaderboard</h1>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* User Stats */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow p-6 mb-8">
                                <h2 className="text-xl font-bold mb-4">Your Progress</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-3xl font-bold text-blue-600">
                                            {stats?.feedbacks || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Feedbacks</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600">
                                            {stats?.qualityFeedbacks || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Quality</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-3xl font-bold text-purple-600">
                                            {stats?.badgeCount || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Badges</div>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <div className="text-3xl font-bold text-orange-600">
                                            {stats?.consecutiveDays || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Day Streak</div>
                                    </div>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold mb-4">Badges</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {BADGES.map((badge) => {
                                        const earned = userBadges.some(
                                            (ub) => ub.badgeType === badge.id
                                        );
                                        return (
                                            <div
                                                key={badge.id}
                                                className={`p-4 rounded-lg border-2 text-center ${earned
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-200 bg-gray-50 opacity-50'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-2">{badge.icon}</div>
                                                <div className="font-semibold text-sm">{badge.name}</div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {badge.description}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.user}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${entry.user.toLowerCase() === account?.toLowerCase()
                                                ? 'bg-indigo-50 border-2 border-indigo-500'
                                                : 'bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-2xl font-bold text-gray-400 w-8">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm">
                                                {entry.user.slice(0, 6)}...{entry.user.slice(-4)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {parseInt(entry.totalPoints.toString()).toLocaleString()} points
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold">
                                                {parseInt(entry.badgeCount.toString())} 🏅
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
