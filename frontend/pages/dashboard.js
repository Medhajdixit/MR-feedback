/**
 * Dashboard Page
 * Main user dashboard with stats and navigation
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { api } from '../utils/api';
import Link from 'next/link';

export default function Dashboard() {
    const { account, contracts } = useWeb3();
    const [stats, setStats] = useState(null);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account) {
            loadDashboardData();
        }
    }, [account]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load user stats from API
            const statsResponse = await api.user.getStats(account);
            setStats(statsResponse.data);

            // Load points from blockchain
            if (contracts.pointEconomy) {
                const balance = await contracts.pointEconomy.getPointBalance(account);
                setPoints(parseInt(balance.toString()));
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-600">Please connect your wallet</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-indigo-600">CampusFeedback+</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </div>
                        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-semibold">
                            {points.toLocaleString()} Points
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <Link href="/feedback/submit">
                                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-2">📝</div>
                                    <h3 className="text-lg font-semibold mb-1">Submit Feedback</h3>
                                    <p className="text-gray-600 text-sm">Share your campus experience</p>
                                </div>
                            </Link>

                            <Link href="/rating/submit">
                                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-2">⭐</div>
                                    <h3 className="text-lg font-semibold mb-1">Rate Faculty</h3>
                                    <p className="text-gray-600 text-sm">Provide constructive ratings</p>
                                </div>
                            </Link>

                            <Link href="/gamification">
                                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-2">🏆</div>
                                    <h3 className="text-lg font-semibold mb-1">Achievements</h3>
                                    <p className="text-gray-600 text-sm">View badges and leaderboard</p>
                                </div>
                            </Link>
                        </div>

                        {/* Stats Overview */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8">
                            <h2 className="text-xl font-bold mb-4">Your Statistics</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600">
                                        {stats?.totalFeedbacks || 0}
                                    </div>
                                    <div className="text-gray-600 text-sm">Feedbacks</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {stats?.totalRatings || 0}
                                    </div>
                                    <div className="text-gray-600 text-sm">Ratings</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600">
                                        {stats?.badges || 0}
                                    </div>
                                    <div className="text-gray-600 text-sm">Badges</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-600">
                                        {stats?.reputation || 100}
                                    </div>
                                    <div className="text-gray-600 text-sm">Reputation</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                            <p className="text-gray-600">Your recent feedbacks and ratings will appear here</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
