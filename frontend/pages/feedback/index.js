/**
 * Feedback List Page
 * Browse all feedbacks with filters
 */

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatAddress, getCategoryColor, timeAgo } from '../../utils/helpers';
import Link from 'next/link';

export default function FeedbackList() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ category: 'all', status: 'all' });

    useEffect(() => {
        loadFeedbacks();
    }, [filter]);

    const loadFeedbacks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.category !== 'all') params.category = filter.category;
            if (filter.status !== 'all') params.status = filter.status;

            const response = await api.feedback.getAll(params);
            setFeedbacks(response.data.feedbacks || []);
        } catch (error) {
            console.error('Error loading feedbacks:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Campus Feedback</h1>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={filter.category}
                                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">All Categories</option>
                                <option value="General">General</option>
                                <option value="Infrastructure">Infrastructure</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Food">Food</option>
                                <option value="Technology">Technology</option>
                                <option value="Safety">Safety</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="implemented">Implemented</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Feedback List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((feedback) => (
                            <div
                                key={feedback.feedbackId}
                                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                                                feedback.category
                                            )}`}
                                        >
                                            {feedback.category}
                                        </span>
                                        {feedback.isAnonymous && (
                                            <span className="text-xs text-gray-500">🔒 Anonymous</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {timeAgo(feedback.createdAt)}
                                    </span>
                                </div>

                                <p className="text-gray-700 mb-4 line-clamp-3">{feedback.content}</p>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>👍 {feedback.votes?.upvotes || 0}</span>
                                        <span>👎 {feedback.votes?.downvotes || 0}</span>
                                        {!feedback.isAnonymous && (
                                            <span>By: {formatAddress(feedback.author)}</span>
                                        )}
                                    </div>
                                    <Link href={`/feedback/${feedback.feedbackId}`}>
                                        <button className="text-indigo-600 hover:text-indigo-700 font-semibold">
                                            View Details →
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
