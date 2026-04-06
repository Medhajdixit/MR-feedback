/**
 * Web3 Context and Wallet Connection
 * Manages wallet connection, network switching, and contract instances
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Contract ABIs (will be imported from artifacts after deployment)
const StudentRegistryABI = [];
const FeedbackABI = [];
const PointEconomyABI = [];
const RatingABI = [];

const Web3Context = createContext();

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contracts, setContracts] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [chainId, setChainId] = useState(null);

    const SHARDEUM_CHAIN_ID = '0x1f90'; // 8080 in hex
    const SHARDEUM_RPC = process.env.NEXT_PUBLIC_SHARDEUM_RPC;

    // Contract addresses (from deployment)
    const CONTRACT_ADDRESSES = {
        studentRegistry: process.env.NEXT_PUBLIC_STUDENT_REGISTRY_ADDRESS,
        feedback: process.env.NEXT_PUBLIC_FEEDBACK_ADDRESS,
        pointEconomy: process.env.NEXT_PUBLIC_POINT_ECONOMY_ADDRESS,
        rating: process.env.NEXT_PUBLIC_RATING_ADDRESS,
    };

    // Connect wallet
    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('Please install MetaMask!');
            return;
        }

        setIsConnecting(true);

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            setAccount(accounts[0]);
            setProvider(provider);
            setSigner(signer);
            setChainId(network.chainId.toString());

            // Check if on Shardeum network
            if (network.chainId.toString() !== '8080') {
                await switchToShardeum();
            }

            // Initialize contracts
            initializeContracts(signer);

            toast.success('Wallet connected!');
        } catch (error) {
            console.error('Wallet connection error:', error);
            toast.error('Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect wallet
    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContracts({});
        setChainId(null);
        toast.success('Wallet disconnected');
    };

    // Switch to Shardeum network
    const switchToShardeum = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SHARDEUM_CHAIN_ID }],
            });
        } catch (switchError) {
            // Network not added, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: SHARDEUM_CHAIN_ID,
                                chainName: 'Shardeum Unstablenet',
                                nativeCurrency: {
                                    name: 'Shardeum',
                                    symbol: 'SHM',
                                    decimals: 18,
                                },
                                rpcUrls: [SHARDEUM_RPC],
                                blockExplorerUrls: ['https://explorer-unstable.shardeum.org'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    toast.error('Failed to add Shardeum network');
                }
            }
        }
    };

    // Initialize contract instances
    const initializeContracts = (signer) => {
        // Note: ABIs will be loaded from artifacts after deployment
        const contracts = {
            studentRegistry: new ethers.Contract(
                CONTRACT_ADDRESSES.studentRegistry,
                StudentRegistryABI,
                signer
            ),
            feedback: new ethers.Contract(
                CONTRACT_ADDRESSES.feedback,
                FeedbackABI,
                signer
            ),
            pointEconomy: new ethers.Contract(
                CONTRACT_ADDRESSES.pointEconomy,
                PointEconomyABI,
                signer
            ),
            rating: new ethers.Contract(
                CONTRACT_ADDRESSES.rating,
                RatingABI,
                signer
            ),
        };

        setContracts(contracts);
    };

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    setAccount(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    const value = {
        account,
        provider,
        signer,
        contracts,
        chainId,
        isConnecting,
        connectWallet,
        disconnectWallet,
        switchToShardeum,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within Web3Provider');
    }
    return context;
}
