/**
 * Feedback Submission Page
 * Form for submitting campus feedback
 */

import { useState } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { api } from '../../utils/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const CATEGORIES = [
    'General',
    'Infrastructure',
    'Faculty',
    'Administration',
    'Food',
    'Technology',
    'Safety',
    'Other',
];

export default function SubmitFeedback() {
    const { account } = useWeb3();
    const router = useRouter();
    const [formData, setFormData] = useState({
        category: 'General',
        content: '',
        isAnonymous: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.content.trim()) {
            toast.error('Please enter feedback content');
            return;
        }

        if (formData.content.length < 20) {
            toast.error('Feedback must be at least 20 characters');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.feedback.submit(formData);

            if (response.data.success) {
                toast.success('Feedback submitted successfully!');
                toast.success(`Quality bonus: ${response.data.feedback.qualityBonus} points`);
                router.push('/dashboard');
            } else {
                toast.error(response.data.reason);
                if (response.data.suggestions?.length > 0) {
                    response.data.suggestions.forEach((suggestion) => {
                        toast(suggestion, { icon: '💡' });
                    });
                }
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-6">Submit Feedback</h1>

                    <form onSubmit={handleSubmit}>
                        {/* Category */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({ ...formData, category: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Content */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Feedback Content
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                rows={8}
                                placeholder="Share your feedback... Be specific and constructive for better quality scores!"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <div className="mt-2 text-sm text-gray-500">
                                {formData.content.length} characters (minimum 20)
                            </div>
                        </div>

                        {/* Anonymous */}
                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isAnonymous}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isAnonymous: e.target.checked })
                                    }
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Submit anonymously (your identity will be hidden)
                                </span>
                            </label>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">
                                💡 Tips for Quality Feedback
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Be specific with examples</li>
                                <li>• Suggest actionable improvements</li>
                                <li>• Maintain a constructive tone</li>
                                <li>• Avoid personal attacks</li>
                            </ul>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
