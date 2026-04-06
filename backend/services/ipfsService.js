/**
 * IPFS Service
 * Handle file uploads to IPFS
 */

const { create } = require('ipfs-http-client');
const { Buffer } = require('buffer');

class IPFSService {
    constructor() {
        this.client = create({
            url: process.env.IPFS_API_URL || 'http://localhost:5001'
        });
        console.log('✅ IPFS service initialized');
    }

    /**
     * Upload text to IPFS
     */
    async uploadText(text) {
        try {
            const result = await this.client.add(text);
            return result.path; // Returns CID
        } catch (error) {
            console.error('IPFS text upload error:', error);
            throw new Error('Failed to upload to IPFS');
        }
    }

    /**
     * Upload image to IPFS
     */
    async uploadImage(imageBuffer) {
        try {
            const result = await this.client.add(imageBuffer);
            return result.path;
        } catch (error) {
            console.error('IPFS image upload error:', error);
            throw new Error('Failed to upload image to IPFS');
        }
    }

    /**
     * Get text from IPFS
     */
    async getText(cid) {
        try {
            const chunks = [];
            for await (const chunk of this.client.cat(cid)) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks).toString('utf8');
        } catch (error) {
            console.error('IPFS text retrieval error:', error);
            throw new Error('Failed to retrieve from IPFS');
        }
    }

    /**
     * Get image from IPFS
     */
    async getImage(cid) {
        try {
            const chunks = [];
            for await (const chunk of this.client.cat(cid)) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error) {
            console.error('IPFS image retrieval error:', error);
            throw new Error('Failed to retrieve image from IPFS');
        }
    }

    /**
     * Get IPFS gateway URL
     */
    getGatewayURL(cid) {
        const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs';
        return `${gateway}/${cid}`;
    }
}

module.exports = new IPFSService();
