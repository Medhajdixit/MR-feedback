/**
 * Rating Submission Page
 * Multi-dimensional faculty and infrastructure rating
 */

import { useState } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { api } from '../../utils/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const FACULTY_DIMENSIONS = [
    'Teaching Effectiveness',
    'Accessibility & Support',
    'Innovation & Adaptability',
    'Assessment Fairness',
    'Professional Development',
];

export default function SubmitRating() {
    const { account } = useWeb3();
    const router = useRouter();
    const [ratingType, setRatingType] = useState('faculty');
    const [formData, setFormData] = useState({
        facultyAddress: '',
        dimensions: [5, 5, 5, 5, 5],
        comment: '',
        isAnonymous: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleDimensionChange = (index, value) => {
        const newDimensions = [...formData.dimensions];
        newDimensions[index] = parseInt(value);
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.facultyAddress) {
            toast.error('Please enter faculty wallet address');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.rating.submit({
                ...formData,
                type: ratingType,
            });

            toast.success('Rating submitted successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Rating submission error:', error);
            toast.error('Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = (
        formData.dimensions.reduce((a, b) => a + b, 0) / formData.dimensions.length
    ).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-6">Submit Rating</h1>

                    <form onSubmit={handleSubmit}>
                        {/* Faculty Address */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Faculty Wallet Address
                            </label>
                            <input
                                type="text"
                                value={formData.facultyAddress}
                                onChange={(e) =>
                                    setFormData({ ...formData, facultyAddress: e.target.value })
                                }
                                placeholder="0x..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Dimensions */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Rate on Multiple Dimensions (1-10)
                            </h3>
                            {FACULTY_DIMENSIONS.map((dimension, index) => (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {dimension}
                                        </label>
                                        <span className="text-lg font-bold text-indigo-600">
                                            {formData.dimensions[index]}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.dimensions[index]}
                                        onChange={(e) => handleDimensionChange(index, e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Poor</span>
                                        <span>Excellent</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Average Display */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                            <div className="text-center">
                                <div className="text-sm text-indigo-700 mb-1">Average Rating</div>
                                <div className="text-4xl font-bold text-indigo-600">
                                    {averageRating}/10
                                </div>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) =>
                                    setFormData({ ...formData, comment: e.target.value })
                                }
                                rows={4}
                                placeholder="Share specific feedback..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
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
                                    Submit anonymously
                                </span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit Rating'}
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
