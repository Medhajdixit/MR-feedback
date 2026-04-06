"""
Text Analysis Engine for CampusFeedback+ 2.0
Multi-model NLP pipeline for content moderation
"""

import os
import re
from typing import Dict, List, Tuple
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import spacy
from collections import Counter

class TextAnalyzer:
    """
    Comprehensive text analysis for feedback moderation
    Includes toxicity detection, sentiment analysis, constructiveness scoring,
    spam detection, and anonymity risk assessment
    """
    
    def __init__(self, model_cache_dir: str = "./models"):
        """
        Initialize all AI models
        
        Args:
            model_cache_dir: Directory to cache downloaded models
        """
        self.model_cache_dir = model_cache_dir
        os.makedirs(model_cache_dir, exist_ok=True)
        
        print("🤖 Initializing Text Analyzer...")
        
        # Load toxicity detection model
        print("  Loading toxicity detection model...")
        self.toxicity_classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            cache_dir=model_cache_dir,
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Load sentiment analysis model
        print("  Loading sentiment analysis model...")
        self.sentiment_classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            cache_dir=model_cache_dir,
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Load NER model for PII detection
        print("  Loading NER model...")
        self.nlp = spacy.load("en_core_web_sm")
        
        # Constructiveness patterns (simple rule-based for now)
        self.constructive_patterns = [
            r'\bsuggest\b', r'\brecommend\b', r'\bimprove\b', r'\benhance\b',
            r'\bcould\b', r'\bshould\b', r'\bwould\b', r'\bhelp\b',
            r'\bbetter\b', r'\bsolution\b', r'\bproposal\b', r'\bidea\b'
        ]
        
        self.destructive_patterns = [
            r'\bterrible\b', r'\bawful\b', r'\bworst\b', r'\bhate\b',
            r'\bstupid\b', r'\buseless\b', r'\bgarbage\b', r'\bpathetic\b'
        ]
        
        print("✅ Text Analyzer initialized successfully\n")
    
    def analyze(self, text: str) -> Dict:
        """
        Comprehensive text analysis
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with all analysis results
        """
        if not text or len(text.strip()) == 0:
            return self._empty_result()
        
        # Run all analyses
        toxicity_score = self.detect_toxicity(text)
        sentiment = self.analyze_sentiment(text)
        constructiveness_score = self.score_constructiveness(text)
        anonymity_risk = self.detect_pii(text)
        spam_probability = self.detect_spam(text)
        category = self.classify_category(text)
        
        return {
            'toxicity_score': toxicity_score,
            'sentiment': sentiment['label'],
            'sentiment_score': sentiment['score'],
            'constructiveness_score': constructiveness_score,
            'anonymity_risk': anonymity_risk,
            'spam_probability': spam_probability,
            'category': category,
            'text_length': len(text),
            'word_count': len(text.split())
        }
    
    def detect_toxicity(self, text: str) -> int:
        """
        Detect toxic content using transformer model
        
        Args:
            text: Input text
            
        Returns:
            Toxicity score (0-100)
        """
        try:
            # Truncate text if too long
            text = text[:512]
            
            result = self.toxicity_classifier(text)[0]
            
            # toxic-bert returns 'toxic' or 'non-toxic'
            if result['label'].lower() == 'toxic':
                # Convert confidence to 0-100 scale
                score = int(result['score'] * 100)
            else:
                # Non-toxic, invert the score
                score = int((1 - result['score']) * 100)
            
            return min(100, max(0, score))
        except Exception as e:
            print(f"Error in toxicity detection: {e}")
            return 0
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment of text
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with sentiment label and confidence score
        """
        try:
            text = text[:512]
            result = self.sentiment_classifier(text)[0]
            
            # Map to our categories
            label_map = {
                'POSITIVE': 'constructive',
                'NEGATIVE': 'negative',
                'NEUTRAL': 'neutral'
            }
            
            label = label_map.get(result['label'].upper(), 'neutral')
            
            return {
                'label': label,
                'score': int(result['score'] * 100)
            }
        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            return {'label': 'neutral', 'score': 50}
    
    def score_constructiveness(self, text: str) -> int:
        """
        Score how constructive the feedback is
        
        Args:
            text: Input text
            
        Returns:
            Constructiveness score (0-100)
        """
        text_lower = text.lower()
        
        # Count constructive patterns
        constructive_count = sum(
            1 for pattern in self.constructive_patterns
            if re.search(pattern, text_lower)
        )
        
        # Count destructive patterns
        destructive_count = sum(
            1 for pattern in self.destructive_patterns
            if re.search(pattern, text_lower)
        )
        
        # Check for specific examples
        has_examples = bool(re.search(r'\bfor example\b|\bsuch as\b|\be\.g\.\b', text_lower))
        
        # Check for actionable suggestions
        has_suggestions = bool(re.search(r'\bshould\b|\bcould\b|\bwould\b|\bsuggest\b', text_lower))
        
        # Calculate base score
        base_score = 50
        
        # Add points for constructive elements
        base_score += constructive_count * 10
        base_score += 15 if has_examples else 0
        base_score += 15 if has_suggestions else 0
        
        # Subtract points for destructive elements
        base_score -= destructive_count * 15
        
        # Length bonus (longer, more detailed feedback is often more constructive)
        word_count = len(text.split())
        if word_count > 50:
            base_score += 10
        elif word_count < 10:
            base_score -= 10
        
        return min(100, max(0, base_score))
    
    def detect_pii(self, text: str) -> str:
        """
        Detect personally identifiable information
        
        Args:
            text: Input text
            
        Returns:
            Risk level: 'low', 'medium', or 'high'
        """
        doc = self.nlp(text)
        
        pii_count = 0
        
        # Check for named entities
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'GPE', 'LOC']:
                pii_count += 1
        
        # Check for email patterns
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            pii_count += 2
        
        # Check for phone numbers
        if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
            pii_count += 2
        
        # Check for student ID patterns
        if re.search(r'\b\d{6,10}\b', text):
            pii_count += 1
        
        # Determine risk level
        if pii_count >= 3:
            return 'high'
        elif pii_count >= 1:
            return 'medium'
        else:
            return 'low'
    
    def detect_spam(self, text: str) -> float:
        """
        Detect spam content
        
        Args:
            text: Input text
            
        Returns:
            Spam probability (0.0-1.0)
        """
        spam_score = 0.0
        
        # Check for repetitive content
        words = text.lower().split()
        if len(words) > 0:
            word_freq = Counter(words)
            most_common_freq = word_freq.most_common(1)[0][1] if word_freq else 0
            repetition_ratio = most_common_freq / len(words)
            
            if repetition_ratio > 0.3:
                spam_score += 0.4
        
        # Check for excessive capitalization
        if text.isupper() and len(text) > 20:
            spam_score += 0.2
        
        # Check for excessive punctuation
        punct_count = sum(1 for char in text if char in '!?.')
        if punct_count > len(text) * 0.1:
            spam_score += 0.2
        
        # Check for promotional keywords
        promo_keywords = ['buy', 'click', 'free', 'offer', 'discount', 'limited time']
        promo_count = sum(1 for keyword in promo_keywords if keyword in text.lower())
        if promo_count >= 2:
            spam_score += 0.3
        
        # Check for very short, meaningless content
        if len(words) < 3:
            spam_score += 0.3
        
        return min(1.0, spam_score)
    
    def classify_category(self, text: str) -> str:
        """
        Classify feedback into categories
        
        Args:
            text: Input text
            
        Returns:
            Category name
        """
        text_lower = text.lower()
        
        # Category keywords
        categories = {
            'Infrastructure': ['building', 'classroom', 'lab', 'facility', 'room', 'maintenance', 'repair'],
            'Faculty': ['professor', 'teacher', 'instructor', 'teaching', 'lecture', 'class'],
            'Food': ['food', 'cafeteria', 'canteen', 'meal', 'dining', 'restaurant'],
            'Technology': ['wifi', 'internet', 'computer', 'software', 'network', 'system', 'tech'],
            'Administration': ['admin', 'office', 'staff', 'registration', 'paperwork', 'process'],
            'Safety': ['safety', 'security', 'guard', 'emergency', 'lighting', 'dangerous']
        }
        
        # Count keyword matches for each category
        category_scores = {}
        for category, keywords in categories.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                category_scores[category] = score
        
        # Return category with highest score, or 'General' if no matches
        if category_scores:
            return max(category_scores, key=category_scores.get)
        else:
            return 'General'
    
    def _empty_result(self) -> Dict:
        """Return empty analysis result"""
        return {
            'toxicity_score': 0,
            'sentiment': 'neutral',
            'sentiment_score': 50,
            'constructiveness_score': 0,
            'anonymity_risk': 'low',
            'spam_probability': 1.0,
            'category': 'General',
            'text_length': 0,
            'word_count': 0
        }


# Example usage
if __name__ == "__main__":
    analyzer = TextAnalyzer()
    
    # Test samples
    test_texts = [
        "The WiFi in the library is terrible and never works!",
        "I suggest improving the cafeteria menu by adding more vegetarian options. For example, we could have salad bars and plant-based protein choices.",
        "Professor Smith's teaching style is excellent. She explains complex concepts clearly and is always available for help.",
        "BUY NOW!!! LIMITED OFFER!!! CLICK HERE FOR FREE STUFF!!!",
        "My name is John Doe and my email is john.doe@example.com"
    ]
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {text[:50]}...")
        print(f"{'='*60}")
        result = analyzer.analyze(text)
        for key, value in result.items():
            print(f"  {key}: {value}")
