"""
Scorer - Sistema di scoring SEO
"""

from typing import Dict, List


class SEOScorer:
    """Calcola score SEO globale e per categoria"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.category_weights = config['scoring']['category_weights']
        
    def calculate_global_score(self, category_scores: Dict[str, int]) -> int:
        """
        Calcola score globale da score di categoria
        
        Args:
            category_scores: Dizionario con score per categoria
            
        Returns:
            Score globale (0-100)
        """
        total_score = 0
        total_weight = 0
        
        for category, weight in self.category_weights.items():
            if category in category_scores:
                total_score += category_scores[category] * weight
                total_weight += weight
        
        if total_weight == 0:
            return 0
        
        return round(total_score / total_weight)
    
    def get_rating(self, score: int) -> str:
        """Ottieni valutazione testuale da score numerico"""
        thresholds = self.config['scoring']['thresholds']
        
        if score >= thresholds['excellent']:
            return 'Eccellente'
        elif score >= thresholds['good']:
            return 'Buono'
        elif score >= thresholds['average']:
            return 'Medio'
        elif score >= thresholds['poor']:
            return 'Scarso'
        else:
            return 'Critico'
    
    def get_rating_emoji(self, score: int) -> str:
        """Ottieni emoji per score"""
        thresholds = self.config['scoring']['thresholds']
        
        if score >= thresholds['excellent']:
            return '🏆'
        elif score >= thresholds['good']:
            return '✅'
        elif score >= thresholds['average']:
            return '⚠️'
        elif score >= thresholds['poor']:
            return '❌'
        else:
            return '💀'
    
    def prioritize_issues(self, issues: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Organizza issues per priorità
        
        Args:
            issues: Lista di issue
            
        Returns:
            Dizionario con issue per severità
        """
        prioritized = {
            'critical': [],
            'important': [],
            'minor': []
        }
        
        for issue in issues:
            severity = issue.get('severity', 'minor')
            if severity in prioritized:
                prioritized[severity].append(issue)
        
        return prioritized

