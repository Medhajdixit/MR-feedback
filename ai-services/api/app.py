"""
Flask API Application
Main entry point for AI moderation services
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from moderation.text_analyzer import TextAnalyzer
from moderation.decision_engine import DecisionEngine
from moderation.enhancement_service import EnhancementService
from privacy.identity_scrubber import IdentityScrubber, PatternAnonymizer, MetadataSanitizer
from analytics.image_verifier import ImageVerifier

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
text_analyzer = TextAnalyzer()
decision_engine = DecisionEngine()
enhancement_service = EnhancementService()
identity_scrubber = IdentityScrubber()
pattern_anonymizer = PatternAnonymizer()
metadata_sanitizer = MetadataSanitizer()
image_verifier = ImageVerifier()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CampusFeedback+ AI Moderation',
        'version': '2.0.0'
    })

@app.route('/api/moderate', methods=['POST'])
def moderate_content():
    """
    Moderate content with AI analysis
    
    Request body:
    {
        "content": "text to moderate",
        "contentType": "feedback|comment|rating",
        "author": "0x..."
    }
    """
    try:
        data = request.json
        content = data.get('content', '')
        content_type = data.get('contentType', 'feedback')
        author = data.get('author', '')

        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Analyze text
        analysis = text_analyzer.analyze(content)
        
        # Make decision
        decision_result = decision_engine.make_decision(
            analysis,
            content_type,
            author
        )

        return jsonify({
            'decision': decision_result['decision'],
            'reason': decision_result['reason'],
            'scores': {
                'toxicity': analysis['toxicity_score'],
                'sentiment': analysis['sentiment_score'],
                'constructiveness': analysis['constructiveness_score'],
                'spam': analysis['spam_score']
            },
            'qualityBonus': decision_result['quality_bonus'],
            'suggestions': decision_result.get('suggestions', []),
            'categories': analysis.get('categories', [])
        })

    except Exception as e:
        print(f"Moderation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scrub-privacy', methods=['POST'])
def scrub_privacy():
    """
    Remove PII from content
    
    Request body:
    {
        "content": "text with PII"
    }
    """
    try:
        data = request.json
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Scrub PII
        scrubbed = identity_scrubber.scrub_pii(content)
        
        # Anonymize patterns
        anonymized = pattern_anonymizer.anonymize_patterns(scrubbed['scrubbed_text'])

        return jsonify({
            'scrubbedText': anonymized['anonymized_text'],
            'entitiesRemoved': scrubbed['entities_removed'],
            'patternsAnonymized': anonymized['patterns_anonymized']
        })

    except Exception as e:
        print(f"Privacy scrubbing error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-image', methods=['POST'])
def verify_image():
    """
    Verify image authenticity and content
    
    Request body:
    {
        "imageData": "base64_encoded_image"
    }
    """
    try:
        data = request.json
        image_data = data.get('imageData', '')

        if not image_data:
            return jsonify({'error': 'Image data is required'}), 400

        # Verify image
        result = image_verifier.verify_image(image_data)

        return jsonify({
            'isValid': result['is_valid'],
            'hasManipulation': result['has_manipulation'],
            'contentType': result['content_type'],
            'confidence': result['confidence']
        })

    except Exception as e:
        print(f"Image verification error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/enhance-feedback', methods=['POST'])
def enhance_feedback():
    """
    Get suggestions to enhance feedback quality
    
    Request body:
    {
        "content": "feedback text"
    }
    """
    try:
        data = request.json
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Get enhancement suggestions
        suggestions = enhancement_service.get_suggestions(content)

        return jsonify({
            'suggestions': suggestions['suggestions'],
            'enhancedVersion': suggestions.get('enhanced_version', ''),
            'improvementAreas': suggestions.get('improvement_areas', [])
        })

    except Exception as e:
        print(f"Enhancement error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    """
    Detailed text analysis without decision
    
    Request body:
    {
        "content": "text to analyze"
    }
    """
    try:
        data = request.json
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Analyze text
        analysis = text_analyzer.analyze(content)

        return jsonify({
            'toxicity': {
                'score': analysis['toxicity_score'],
                'labels': analysis.get('toxicity_labels', [])
            },
            'sentiment': {
                'score': analysis['sentiment_score'],
                'label': analysis['sentiment_label']
            },
            'constructiveness': {
                'score': analysis['constructiveness_score'],
                'features': analysis.get('constructiveness_features', {})
            },
            'spam': {
                'score': analysis['spam_score'],
                'isSpam': analysis['is_spam']
            },
            'categories': analysis.get('categories', []),
            'language': analysis.get('language', 'en')
        })

    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch-moderate', methods=['POST'])
def batch_moderate():
    """
    Moderate multiple contents in batch
    
    Request body:
    {
        "contents": [
            {"id": "1", "content": "text1"},
            {"id": "2", "content": "text2"}
        ]
    }
    """
    try:
        data = request.json
        contents = data.get('contents', [])

        if not contents:
            return jsonify({'error': 'Contents array is required'}), 400

        results = []
        for item in contents:
            content_id = item.get('id')
            content = item.get('content', '')

            if content:
                analysis = text_analyzer.analyze(content)
                decision_result = decision_engine.make_decision(
                    analysis,
                    'feedback',
                    ''
                )

                results.append({
                    'id': content_id,
                    'decision': decision_result['decision'],
                    'scores': {
                        'toxicity': analysis['toxicity_score'],
                        'sentiment': analysis['sentiment_score'],
                        'constructiveness': analysis['constructiveness_score']
                    }
                })

        return jsonify({'results': results})

    except Exception as e:
        print(f"Batch moderation error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"\n{'='*60}")
    print(f"🤖 CampusFeedback+ AI Moderation Service")
    print(f"📍 Port: {port}")
    print(f"🌍 Environment: {os.environ.get('FLASK_ENV', 'production')}")
    print(f"{'='*60}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
