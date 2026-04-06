"""
Decision Engine for CampusFeedback+ 2.0
Rule-based and ML-driven moderation decisions
"""

from typing import Dict, List, Tuple
from enum import Enum

class ModerationDecision(Enum):
    """Moderation decision types"""
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    FLAG = "FLAG"
    PENDING = "PENDING"

class DecisionEngine:
    """
    Make moderation decisions based on AI analysis results
    """
    
    def __init__(self, config: Dict = None):
        """
        Initialize decision engine with configurable thresholds
        
        Args:
            config: Configuration dictionary with thresholds
        """
        print("⚖️  Initializing Decision Engine...")
        
        # Default thresholds (can be overridden)
        self.config = config or {}
        self.toxicity_threshold = self.config.get('toxicity_threshold', 70)
        self.spam_threshold = self.config.get('spam_threshold', 0.8)
        self.constructiveness_min = self.config.get('constructiveness_min', 30)
        self.anonymity_risk_threshold = self.config.get('anonymity_risk', 'medium')
        
        # Quality bonus calculation
        self.max_quality_bonus = 30
        
        print(f"  Toxicity threshold: {self.toxicity_threshold}")
        print(f"  Spam threshold: {self.spam_threshold}")
        print(f"  Constructiveness minimum: {self.constructiveness_min}")
        print("✅ Decision Engine initialized\n")
    
    def make_decision(self, analysis_results: Dict) -> Dict:
        """
        Make moderation decision based on analysis
        
        Args:
            analysis_results: Results from TextAnalyzer
            
        Returns:
            Dictionary with decision, reason, quality bonus, and suggestions
        """
        toxicity = analysis_results.get('toxicity_score', 0)
        spam_prob = analysis_results.get('spam_probability', 0)
        constructiveness = analysis_results.get('constructiveness_score', 0)
        anonymity_risk = analysis_results.get('anonymity_risk', 'low')
        
        # Auto-reject criteria
        if toxicity > self.toxicity_threshold:
            return {
                'decision': ModerationDecision.REJECT.value,
                'reason': f'High toxicity detected ({toxicity}/100)',
                'quality_bonus': 0,
                'suggestions': self._get_toxicity_suggestions()
            }
        
        if spam_prob > self.spam_threshold:
            return {
                'decision': ModerationDecision.REJECT.value,
                'reason': f'Spam content detected ({int(spam_prob * 100)}% probability)',
                'quality_bonus': 0,
                'suggestions': self._get_spam_suggestions()
            }
        
        # Flag for human review
        if anonymity_risk == 'high':
            return {
                'decision': ModerationDecision.FLAG.value,
                'reason': 'High privacy risk detected - contains PII',
                'quality_bonus': 0,
                'suggestions': self._get_privacy_suggestions()
            }
        
        if constructiveness < self.constructiveness_min:
            return {
                'decision': ModerationDecision.FLAG.value,
                'reason': f'Low constructiveness score ({constructiveness}/100)',
                'quality_bonus': 0,
                'suggestions': self._get_constructiveness_suggestions()
            }
        
        # Borderline cases - flag for review
        if self._is_borderline(toxicity, spam_prob, constructiveness):
            return {
                'decision': ModerationDecision.FLAG.value,
                'reason': 'Borderline case - requires human review',
                'quality_bonus': self._calculate_quality_bonus(analysis_results),
                'suggestions': []
            }
        
        # Approve with quality bonus
        quality_bonus = self._calculate_quality_bonus(analysis_results)
        
        return {
            'decision': ModerationDecision.APPROVE.value,
            'reason': 'Content meets quality standards',
            'quality_bonus': quality_bonus,
            'suggestions': self._get_improvement_suggestions(analysis_results)
        }
    
    def _is_borderline(self, toxicity: int, spam_prob: float, constructiveness: int) -> bool:
        """
        Check if content is in borderline zone
        
        Args:
            toxicity: Toxicity score
            spam_prob: Spam probability
            constructiveness: Constructiveness score
            
        Returns:
            True if borderline
        """
        margin = 10
        
        # Borderline toxicity
        if (self.toxicity_threshold - margin) <= toxicity <= (self.toxicity_threshold + margin):
            return True
        
        # Borderline spam
        if (self.spam_threshold - 0.1) <= spam_prob <= (self.spam_threshold + 0.1):
            return True
        
        # Borderline constructiveness
        if (self.constructiveness_min - margin) <= constructiveness <= (self.constructiveness_min + margin):
            return True
        
        return False
    
    def _calculate_quality_bonus(self, analysis_results: Dict) -> int:
        """
        Calculate quality bonus points (0-30)
        
        Args:
            analysis_results: Analysis results
            
        Returns:
            Bonus points
        """
        constructiveness = analysis_results.get('constructiveness_score', 0)
        sentiment = analysis_results.get('sentiment', 'neutral')
        word_count = analysis_results.get('word_count', 0)
        
        bonus = 0
        
        # Constructiveness bonus (0-15 points)
        if constructiveness >= 80:
            bonus += 15
        elif constructiveness >= 60:
            bonus += 10
        elif constructiveness >= 40:
            bonus += 5
        
        # Sentiment bonus (0-5 points)
        if sentiment == 'constructive':
            bonus += 5
        
        # Length bonus (0-5 points) - detailed feedback
        if word_count > 100:
            bonus += 5
        elif word_count > 50:
            bonus += 3
        
        # Specific examples bonus (0-5 points)
        # This would be detected in constructiveness scoring
        
        return min(self.max_quality_bonus, bonus)
    
    def _get_toxicity_suggestions(self) -> List[str]:
        """Get suggestions for toxic content"""
        return [
            "Remove offensive or harmful language",
            "Focus on constructive criticism rather than personal attacks",
            "Rephrase your feedback in a respectful manner",
            "Avoid inflammatory or aggressive tone"
        ]
    
    def _get_spam_suggestions(self) -> List[str]:
        """Get suggestions for spam content"""
        return [
            "Provide meaningful and relevant feedback",
            "Avoid repetitive content",
            "Write in a natural, conversational tone",
            "Focus on specific issues or suggestions"
        ]
    
    def _get_privacy_suggestions(self) -> List[str]:
        """Get suggestions for privacy concerns"""
        return [
            "Remove personal names and identifying information",
            "Avoid sharing email addresses or phone numbers",
            "Use general descriptions instead of specific identifiers",
            "Consider submitting anonymously"
        ]
    
    def _get_constructiveness_suggestions(self) -> List[str]:
        """Get suggestions for low constructiveness"""
        return [
            "Provide specific examples to support your feedback",
            "Suggest actionable improvements or solutions",
            "Explain why something is problematic and how it could be better",
            "Include both positive aspects and areas for improvement"
        ]
    
    def _get_improvement_suggestions(self, analysis_results: Dict) -> List[str]:
        """Get general improvement suggestions for approved content"""
        suggestions = []
        
        constructiveness = analysis_results.get('constructiveness_score', 0)
        word_count = analysis_results.get('word_count', 0)
        
        if constructiveness < 70:
            suggestions.append("Consider adding more specific examples or suggestions")
        
        if word_count < 30:
            suggestions.append("Providing more detail could make your feedback more impactful")
        
        return suggestions
    
    def update_thresholds(self, new_config: Dict):
        """
        Update moderation thresholds
        
        Args:
            new_config: New configuration dictionary
        """
        if 'toxicity_threshold' in new_config:
            self.toxicity_threshold = new_config['toxicity_threshold']
        if 'spam_threshold' in new_config:
            self.spam_threshold = new_config['spam_threshold']
        if 'constructiveness_min' in new_config:
            self.constructiveness_min = new_config['constructiveness_min']
        
        print(f"✅ Thresholds updated: toxicity={self.toxicity_threshold}, spam={self.spam_threshold}, constructiveness={self.constructiveness_min}")


# Example usage
if __name__ == "__main__":
    engine = DecisionEngine()
    
    # Test cases
    test_cases = [
        {
            'name': 'Good feedback',
            'analysis': {
                'toxicity_score': 10,
                'spam_probability': 0.1,
                'constructiveness_score': 85,
                'sentiment': 'constructive',
                'word_count': 75,
                'anonymity_risk': 'low'
            }
        },
        {
            'name': 'Toxic content',
            'analysis': {
                'toxicity_score': 85,
                'spam_probability': 0.2,
                'constructiveness_score': 20,
                'sentiment': 'negative',
                'word_count': 30,
                'anonymity_risk': 'low'
            }
        },
        {
            'name': 'Spam',
            'analysis': {
                'toxicity_score': 5,
                'spam_probability': 0.9,
                'constructiveness_score': 10,
                'sentiment': 'neutral',
                'word_count': 5,
                'anonymity_risk': 'low'
            }
        },
        {
            'name': 'Privacy risk',
            'analysis': {
                'toxicity_score': 15,
                'spam_probability': 0.1,
                'constructiveness_score': 60,
                'sentiment': 'neutral',
                'word_count': 50,
                'anonymity_risk': 'high'
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n{'='*60}")
        print(f"Test: {test['name']}")
        print(f"{'='*60}")
        decision = engine.make_decision(test['analysis'])
        for key, value in decision.items():
            print(f"  {key}: {value}")
