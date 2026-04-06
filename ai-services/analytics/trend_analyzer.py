"""
Trend Analyzer for CampusFeedback+ 2.0
Detect emerging issues and predict campus mood trends
"""

from typing import Dict, List
from collections import Counter, defaultdict
from datetime import datetime, timedelta

class TrendAnalyzer:
    """
    Analyze feedback trends and predict issues
    """
    
    def __init__(self):
        """Initialize trend analyzer"""
        self.feedback_history = []
        self.category_trends = defaultdict(list)
        self.sentiment_history = []
    
    def add_feedback(self, feedback: Dict):
        """
        Add feedback to history for trend analysis
        
        Args:
            feedback: Feedback data with analysis results
        """
        feedback['timestamp'] = datetime.now()
        self.feedback_history.append(feedback)
        
        # Track by category
        category = feedback.get('category', 'General')
        self.category_trends[category].append(feedback)
        
        # Track sentiment
        self.sentiment_history.append({
            'sentiment': feedback.get('sentiment', 'neutral'),
            'score': feedback.get('constructiveness_score', 50),
            'timestamp': feedback['timestamp']
        })
    
    def detect_emerging_issues(self, days: int = 7) -> List[Dict]:
        """
        Identify emerging issues from recent feedback
        
        Args:
            days: Number of days to analyze
            
        Returns:
            List of emerging issues with severity
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_feedback = [
            f for f in self.feedback_history
            if f['timestamp'] > cutoff_date
        ]
        
        if not recent_feedback:
            return []
        
        # Analyze by category
        category_counts = Counter(f.get('category', 'General') for f in recent_feedback)
        
        # Detect spikes
        issues = []
        for category, count in category_counts.most_common():
            if count >= 5:  # Threshold for emerging issue
                avg_constructiveness = sum(
                    f.get('constructiveness_score', 0)
                    for f in recent_feedback
                    if f.get('category') == category
                ) / count
                
                severity = 'high' if count >= 10 else 'medium' if count >= 7 else 'low'
                
                issues.append({
                    'category': category,
                    'count': count,
                    'severity': severity,
                    'avg_constructiveness': round(avg_constructiveness, 1),
                    'trend': 'increasing'
                })
        
        return issues
    
    def predict_campus_mood(self, days: int = 30) -> Dict:
        """
        Predict overall campus mood based on feedback patterns
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Mood prediction with confidence
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_sentiment = [
            s for s in self.sentiment_history
            if s['timestamp'] > cutoff_date
        ]
        
        if not recent_sentiment:
            return {'mood': 'neutral', 'confidence': 0, 'trend': 'stable'}
        
        # Calculate average sentiment score
        avg_score = sum(s['score'] for s in recent_sentiment) / len(recent_sentiment)
        
        # Determine mood
        if avg_score >= 70:
            mood = 'positive'
        elif avg_score >= 40:
            mood = 'neutral'
        else:
            mood = 'negative'
        
        # Calculate trend
        if len(recent_sentiment) >= 10:
            first_half_avg = sum(s['score'] for s in recent_sentiment[:len(recent_sentiment)//2]) / (len(recent_sentiment)//2)
            second_half_avg = sum(s['score'] for s in recent_sentiment[len(recent_sentiment)//2:]) / (len(recent_sentiment) - len(recent_sentiment)//2)
            
            if second_half_avg > first_half_avg + 10:
                trend = 'improving'
            elif second_half_avg < first_half_avg - 10:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        return {
            'mood': mood,
            'score': round(avg_score, 1),
            'confidence': min(100, len(recent_sentiment) * 2),
            'trend': trend,
            'sample_size': len(recent_sentiment)
        }
    
    def get_category_statistics(self) -> Dict:
        """
        Get statistics for each category
        
        Returns:
            Dictionary with category stats
        """
        stats = {}
        
        for category, feedbacks in self.category_trends.items():
            if feedbacks:
                stats[category] = {
                    'total_count': len(feedbacks),
                    'avg_constructiveness': round(
                        sum(f.get('constructiveness_score', 0) for f in feedbacks) / len(feedbacks),
                        1
                    ),
                    'avg_toxicity': round(
                        sum(f.get('toxicity_score', 0) for f in feedbacks) / len(feedbacks),
                        1
                    ),
                    'recent_count_7d': len([
                        f for f in feedbacks
                        if f['timestamp'] > datetime.now() - timedelta(days=7)
                    ])
                }
        
        return stats


# Example usage
if __name__ == "__main__":
    analyzer = TrendAnalyzer()
    
    # Simulate some feedback
    test_feedback = [
        {'category': 'Infrastructure', 'constructiveness_score': 60, 'toxicity_score': 20, 'sentiment': 'neutral'},
        {'category': 'Infrastructure', 'constructiveness_score': 55, 'toxicity_score': 30, 'sentiment': 'negative'},
        {'category': 'Food', 'constructiveness_score': 75, 'toxicity_score': 10, 'sentiment': 'constructive'},
        {'category': 'Infrastructure', 'constructiveness_score': 50, 'toxicity_score': 40, 'sentiment': 'negative'},
    ]
    
    for feedback in test_feedback:
        analyzer.add_feedback(feedback)
    
    print("Emerging Issues:", analyzer.detect_emerging_issues())
    print("Campus Mood:", analyzer.predict_campus_mood())
    print("Category Stats:", analyzer.get_category_statistics())
