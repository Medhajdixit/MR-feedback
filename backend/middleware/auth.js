/**
 * Authentication Middleware
 * JWT-based authentication with wallet signature verification
 */

const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

/**
 * Generate JWT token for authenticated user
 */
function generateToken(walletAddress) {
    return jwt.sign(
        { address: walletAddress.toLowerCase() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware to authenticate requests
 */
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = {
            address: decoded.address
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * Verify wallet signature (for login)
 */
async function verifySignature(message, signature, address) {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Middleware to check if user is verified student
 */
async function requireVerifiedStudent(req, res, next) {
    try {
        const blockchainService = require('../services/blockchainService');
        const isVerified = await blockchainService.isVerifiedStudent(req.user.address);

        if (!isVerified) {
            return res.status(403).json({
                error: 'Verified student status required',
                message: 'Please complete student verification first'
            });
        }

        next();
    } catch (error) {
        console.error('Verification check error:', error);
        res.status(500).json({ error: 'Verification check failed' });
    }
}

/**
 * Middleware to check if user is admin
 */
async function requireAdmin(req, res, next) {
    try {
        const blockchainService = require('../services/blockchainService');
        const profile = await blockchainService.getStudentProfile(req.user.address);

        if (profile.role !== 2) { // 2 = Admin role
            return res.status(403).json({
                error: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Admin check failed' });
    }
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    verifySignature,
    requireVerifiedStudent,
    requireAdmin
};
