"""
Enhancement Service for CampusFeedback+ 2.0
AI-powered feedback improvement suggestions
"""

from typing import Dict, List
import re

class EnhancementService:
    """
    Generate improvement suggestions for feedback
    """
    
    def __init__(self):
        """Initialize enhancement service"""
        print("✨ Initializing Enhancement Service...")
        print("✅ Enhancement Service initialized\n")
    
    def generate_suggestions(self, text: str, analysis_results: Dict) -> Dict:
        """
        Generate improvement suggestions
        
        Args:
            text: Original feedback text
            analysis_results: Results from TextAnalyzer
            
        Returns:
            Dictionary with suggestions and improved version
        """
        suggestions = []
        improvements = []
        
        constructiveness = analysis_results.get('constructiveness_score', 0)
        word_count = analysis_results.get('word_count', 0)
        sentiment = analysis_results.get('sentiment', 'neutral')
        
        # Check for specific issues
        has_examples = self._has_examples(text)
        has_suggestions = self._has_suggestions(text)
        has_positive_aspects = self._has_positive_aspects(text)
        
        # Generate specific suggestions
        if not has_examples:
            suggestions.append("Add specific examples to support your points")
            improvements.append("For example: Instead of 'The WiFi is bad', try 'The WiFi in Building A disconnects every 10 minutes'")
        
        if not has_suggestions:
            suggestions.append("Include actionable suggestions for improvement")
            improvements.append("For example: 'I suggest adding more access points in the library'")
        
        if not has_positive_aspects and sentiment == 'negative':
            suggestions.append("Consider mentioning positive aspects along with areas for improvement")
            improvements.append("Balanced feedback is more constructive and actionable")
        
        if word_count < 20:
            suggestions.append("Provide more detail to make your feedback more impactful")
            improvements.append("Explain the issue, its impact, and potential solutions")
        
        if constructiveness < 50:
            suggestions.append("Focus on constructive criticism rather than complaints")
            improvements.append("Describe what could be improved and how")
        
        # Generate improved version
        improved_version = self._generate_improved_version(text, analysis_results)
        
        return {
            'suggestions': suggestions,
            'improvements': improvements,
            'improved_version': improved_version,
            'quality_improvement_potential': self._calculate_improvement_potential(analysis_results)
        }
    
    def _has_examples(self, text: str) -> bool:
        """Check if text contains specific examples"""
        example_patterns = [
            r'\bfor example\b',
            r'\bsuch as\b',
            r'\be\.g\.\b',
            r'\blike\b',
            r'\bincluding\b'
        ]
        return any(re.search(pattern, text.lower()) for pattern in example_patterns)
    
    def _has_suggestions(self, text: str) -> bool:
        """Check if text contains suggestions"""
        suggestion_patterns = [
            r'\bshould\b',
            r'\bcould\b',
            r'\bwould\b',
            r'\bsuggest\b',
            r'\brecommend\b',
            r'\bpropose\b'
        ]
        return any(re.search(pattern, text.lower()) for pattern in suggestion_patterns)
    
    def _has_positive_aspects(self, text: str) -> bool:
        """Check if text mentions positive aspects"""
        positive_patterns = [
            r'\bgood\b',
            r'\bgreat\b',
            r'\bexcellent\b',
            r'\bhelpful\b',
            r'\bappreciate\b',
            r'\bthank\b'
        ]
        return any(re.search(pattern, text.lower()) for pattern in positive_patterns)
    
    def _generate_improved_version(self, text: str, analysis_results: Dict) -> str:
        """
        Generate an improved version of the feedback
        
        Args:
            text: Original text
            analysis_results: Analysis results
            
        Returns:
            Improved version (or empty if already good)
        """
        constructiveness = analysis_results.get('constructiveness_score', 0)
        
        # Only suggest improvements if score is low
        if constructiveness >= 70:
            return ""
        
        # This is a simplified version - in production, use GPT-3/4 for better results
        improved = text
        
        # Add suggestion template if missing
        if not self._has_suggestions(text):
            improved += "\n\nSuggestion: [Consider adding specific recommendations for improvement here]"
        
        # Add example template if missing
        if not self._has_examples(text):
            improved += "\n\nExample: [Provide a specific example to illustrate your point]"
        
        return improved
    
    def _calculate_improvement_potential(self, analysis_results: Dict) -> int:
        """
        Calculate how much the feedback could be improved
        
        Args:
            analysis_results: Analysis results
            
        Returns:
            Improvement potential (0-100)
        """
        current_score = analysis_results.get('constructiveness_score', 0)
        
        # Maximum achievable score is 100
        # Potential is the gap between current and maximum
        potential = 100 - current_score
        
        return max(0, min(100, potential))


# Example usage
if __name__ == "__main__":
    service = EnhancementService()
    
    test_cases = [
        {
            'text': "The WiFi is terrible!",
            'analysis': {
                'constructiveness_score': 25,
                'word_count': 4,
                'sentiment': 'negative'
            }
        },
        {
            'text': "I suggest improving the library WiFi by adding more access points, especially in the study areas. For example, the second floor has very weak signal.",
            'analysis': {
                'constructiveness_score': 85,
                'word_count': 25,
                'sentiment': 'constructive'
            }
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {test['text']}")
        print(f"{'='*60}")
        result = service.generate_suggestions(test['text'], test['analysis'])
        print(f"Suggestions: {result['suggestions']}")
        print(f"Improvement potential: {result['quality_improvement_potential']}%")
        if result['improved_version']:
            print(f"Improved version:\n{result['improved_version']}")
