/**
 * useContract Hook
 * Simplified contract interaction
 */

import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import toast from 'react-hot-toast';

export function useContract(contractName) {
    const { contracts } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const contract = contracts[contractName];

    const call = async (method, ...args) => {
        if (!contract) {
            toast.error('Contract not initialized');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await contract[method](...args);
            return result;
        } catch (err) {
            console.error(`Contract call error (${method}):`, err);
            setError(err.message);
            toast.error(`Transaction failed: ${err.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const send = async (method, ...args) => {
        if (!contract) {
            toast.error('Contract not initialized');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const tx = await contract[method](...args);
            toast.loading('Transaction pending...', { id: tx.hash });

            const receipt = await tx.wait();
            toast.success('Transaction confirmed!', { id: tx.hash });

            return receipt;
        } catch (err) {
            console.error(`Contract transaction error (${method}):`, err);
            setError(err.message);
            toast.error(`Transaction failed: ${err.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        contract,
        loading,
        error,
        call,
        send,
    };
}
