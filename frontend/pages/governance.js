/**
 * Governance Page
 * DAO proposals and voting
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { api } from '../utils/api';
import Link from 'next/link';

const PROPOSAL_TYPES = [
    'Policy Change',
    'Feature Request',
    'Budget Allocation',
    'Moderator Election',
    'Threshold Update',
    'Other',
];

export default function Governance() {
    const { account } = useWeb3();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadProposals();
    }, [filter]);

    const loadProposals = async () => {
        try {
            setLoading(true);
            const response = await api.governance.getProposals({ status: filter });
            setProposals(response.data.proposals || []);
        } catch (error) {
            console.error('Error loading proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Active: 'bg-green-100 text-green-800',
            Passed: 'bg-blue-100 text-blue-800',
            Rejected: 'bg-red-100 text-red-800',
            Executed: 'bg-purple-100 text-purple-800',
            Pending: 'bg-yellow-100 text-yellow-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Governance</h1>
                    <Link href="/governance/create">
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                            Create Proposal
                        </button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'Active', 'Passed', 'Rejected', 'Executed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Proposals List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">🏛️</div>
                        <h3 className="text-xl font-semibold mb-2">No Proposals Yet</h3>
                        <p className="text-gray-600">Be the first to create a proposal!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <div
                                key={proposal.id}
                                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold">{proposal.title}</h3>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                    proposal.status
                                                )}`}
                                            >
                                                {proposal.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{proposal.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Type: {PROPOSAL_TYPES[proposal.proposalType]}</span>
                                            <span>•</span>
                                            <span>
                                                Proposer: {proposal.proposer.slice(0, 6)}...
                                                {proposal.proposer.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Voting Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {proposal.forVotes || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">For</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">
                                            {proposal.againstVotes || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Against</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-600">
                                            {proposal.abstainVotes || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Abstain</div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {proposal.status === 'Active' && (
                                    <Link href={`/governance/${proposal.id}`}>
                                        <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                                            View & Vote
                                        </button>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
