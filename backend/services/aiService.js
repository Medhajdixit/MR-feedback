/**
 * AI Service Integration
 * Communicates with Python AI moderation service
 */

const axios = require('axios');

class AIService {
    constructor() {
        this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Moderate content
     */
    async moderateContent(text, contentType = 'feedback') {
        try {
            const response = await this.client.post('/api/moderate', {
                text,
                content_type: contentType
            });
            return response.data;
        } catch (error) {
            console.error('AI moderation error:', error.message);
            throw new Error('AI moderation service unavailable');
        }
    }

    /**
     * Scrub PII and anonymize
     */
    async scrubPrivacy(text, anonymizePatterns = true) {
        try {
            const response = await this.client.post('/api/scrub-privacy', {
                text,
                anonymize_patterns: anonymizePatterns
            });
            return response.data;
        } catch (error) {
            console.error('Privacy scrubbing error:', error.message);
            throw new Error('Privacy service unavailable');
        }
    }

    /**
     * Verify image authenticity
     */
    async verifyImage(imageBuffer) {
        try {
            const formData = new FormData();
            formData.append('image', imageBuffer);

            const response = await this.client.post('/api/verify-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Image verification error:', error.message);
            throw new Error('Image verification service unavailable');
        }
    }

    /**
     * Get enhancement suggestions
     */
    async enhanceFeedback(text, analysis = null) {
        try {
            const response = await this.client.post('/api/enhance-feedback', {
                text,
                analysis
            });
            return response.data;
        } catch (error) {
            console.error('Enhancement service error:', error.message);
            throw new Error('Enhancement service unavailable');
        }
    }

    /**
     * Analyze text only (no decision)
     */
    async analyzeText(text) {
        try {
            const response = await this.client.post('/api/analyze-text', {
                text
            });
            return response.data;
        } catch (error) {
            console.error('Text analysis error:', error.message);
            throw new Error('Text analysis service unavailable');
        }
    }

    /**
     * Batch moderate multiple texts
     */
    async batchModerate(texts) {
        try {
            const response = await this.client.post('/api/batch-moderate', {
                texts
            });
            return response.data;
        } catch (error) {
            console.error('Batch moderation error:', error.message);
            throw new Error('Batch moderation service unavailable');
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = new AIService();
