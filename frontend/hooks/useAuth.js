/**
 * useAuth Hook
 * Authentication state and methods
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export function useAuth() {
    const { account, signer } = useWeb3();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();
    }, [account]);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');

        if (!token || !account) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.auth.verify();
            if (response.data.valid) {
                setIsAuthenticated(true);
                // Load user profile
                const profileResponse = await api.user.getProfile(account);
                setUser(profileResponse.data);
            }
        } catch (error) {
            setIsAuthenticated(false);
            localStorage.removeItem('auth_token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        if (!account || !signer) {
            toast.error('Please connect your wallet first');
            return false;
        }

        try {
            // Get nonce
            const nonceResponse = await api.auth.getNonce(account);
            const { nonce } = nonceResponse.data;

            // Sign message
            const signature = await signer.signMessage(nonce);

            // Login
            const loginResponse = await api.auth.login(account, signature, nonce);
            const { token, user } = loginResponse.data;

            // Store token
            localStorage.setItem('auth_token', token);
            setIsAuthenticated(true);
            setUser(user);

            toast.success('Successfully logged in!');
            return true;
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
        toast.success('Logged out');
    };

    return {
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
    };
}
