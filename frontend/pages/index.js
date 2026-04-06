/**
 * Home Page
 * Landing page with wallet connection
 */

import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useRouter } from 'next/router';

export default function Home() {
    const { account, connectWallet, isConnecting } = useWeb3();
    const router = useRouter();

    if (account) {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Header */}
                    <h1 className="text-6xl font-bold text-gray-900 mb-6">
                        CampusFeedback<span className="text-indigo-600">+</span> 2.0
                    </h1>
                    <p className="text-xl text-gray-600 mb-12">
                        AI-Moderated Campus Feedback System on Shardeum Blockchain
                    </p>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">🤖</div>
                            <h3 className="text-lg font-semibold mb-2">AI Moderation</h3>
                            <p className="text-gray-600">
                                Intelligent content analysis with toxicity detection and quality scoring
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">🔗</div>
                            <h3 className="text-lg font-semibold mb-2">Blockchain Powered</h3>
                            <p className="text-gray-600">
                                Transparent and immutable feedback records on Shardeum
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">🎮</div>
                            <h3 className="text-lg font-semibold mb-2">Gamification</h3>
                            <p className="text-gray-600">
                                Earn points, unlock badges, and climb the leaderboard
                            </p>
                        </div>
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet to Get Started'}
                    </button>

                    {/* Info */}
                    <p className="mt-8 text-gray-500">
                        Requires MetaMask wallet and Shardeum network
                    </p>
                </div>
            </div>
        </div>
    );
}
