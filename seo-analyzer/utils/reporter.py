"""
Reporter - Generazione report SEO in vari formati
"""

from typing import Dict, List
import json
from datetime import datetime


class SEOReporter:
    """Genera report SEO in vari formati"""
    
    def __init__(self, config: Dict):
        self.config = config
        
    def generate_console_report(self, results: Dict) -> str:
        """Genera report per console con colori"""
        
        lines = []
        lines.append("=" * 70)
        lines.append(f"🔍 ANALISI SEO - {results['url']}")
        lines.append(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("=" * 70)
        lines.append("")
        
        # Score globale
        score = results['global_score']
        rating = results['rating']
        emoji = results['rating_emoji']
        
        lines.append(f"📊 SCORE GLOBALE: {emoji} {score}/100 ({rating})")
        lines.append("")
        
        # Breakdown per categoria
        lines.append("📋 Breakdown per Categoria:")
        lines.append("-" * 70)
        
        for category, cat_score in results['category_scores'].items():
            emoji_cat = '✅' if cat_score >= 75 else '⚠️' if cat_score >= 60 else '❌'
            bar = self._create_progress_bar(cat_score)
            lines.append(f"  {emoji_cat} {category.capitalize():15} {bar} {cat_score}/100")
        
        lines.append("")
        
        # Issues per severità
        issues = results['all_issues']
        critical = [i for i in issues if i['severity'] == 'critical']
        important = [i for i in issues if i['severity'] == 'important']
        minor = [i for i in issues if i['severity'] == 'minor']
        
        if critical:
            lines.append(f"🔴 Problemi Critici ({len(critical)}):")
            lines.append("-" * 70)
            for idx, issue in enumerate(critical[:5], 1):
                lines.append(f"  {idx}. {issue['message']}")
                lines.append(f"     💡 {issue['recommendation']}")
                lines.append("")
        
        if important:
            lines.append(f"🟡 Problemi Importanti ({len(important)}):")
            lines.append("-" * 70)
            for idx, issue in enumerate(important[:5], 1):
                lines.append(f"  {idx}. {issue['message']}")
                lines.append(f"     💡 {issue['recommendation']}")
                lines.append("")
        
        if minor:
            lines.append(f"🟢 Miglioramenti Suggeriti ({len(minor)}):")
            lines.append("-" * 70)
            for idx, issue in enumerate(minor[:3], 1):
                lines.append(f"  {idx}. {issue['message']}")
                lines.append("")
        
        # Top raccomandazioni
        lines.append("💡 TOP RACCOMANDAZIONI:")
        lines.append("-" * 70)
        
        top_issues = critical[:3] if critical else important[:3]
        for idx, issue in enumerate(top_issues, 1):
            lines.append(f"{idx}. {issue['recommendation']}")
            lines.append(f"   Impatto: {issue['impact']}")
            lines.append("")
        
        lines.append("=" * 70)
        
        return "\n".join(lines)
    
    def generate_json_report(self, results: Dict) -> str:
        """Genera report in formato JSON"""
        return json.dumps(results, indent=2, ensure_ascii=False)
    
    def generate_html_report(self, results: Dict) -> str:
        """Genera report HTML"""
        
        score = results['global_score']
        rating = results['rating']
        
        html = f"""
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report SEO - {results['url']}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
        }}
        h1 {{ color: #2c3e50; margin-bottom: 10px; }}
        .score {{
            font-size: 72px;
            font-weight: bold;
            color: {'#27ae60' if score >= 75 else '#f39c12' if score >= 60 else '#e74c3c'};
            text-align: center;
            margin: 30px 0;
        }}
        .rating {{
            text-align: center;
            font-size: 24px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }}
        .categories {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        .category {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }}
        .category h3 {{ margin-bottom: 10px; color: #2c3e50; }}
        .category-score {{
            font-size: 36px;
            font-weight: bold;
            color: #3498db;
        }}
        .progress-bar {{
            height: 10px;
            background: #ecf0f1;
            border-radius: 5px;
            overflow: hidden;
            margin-top: 10px;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            transition: width 0.3s ease;
        }}
        .issues {{
            margin-top: 40px;
        }}
        .issue-section {{
            margin-bottom: 30px;
        }}
        .issue-section h2 {{
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }}
        .issue {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid #e74c3c;
        }}
        .issue.important {{ border-left-color: #f39c12; }}
        .issue.minor {{ border-left-color: #95a5a6; }}
        .issue-message {{
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .issue-recommendation {{
            color: #7f8c8d;
            font-size: 14px;
        }}
        .footer {{
            margin-top: 40px;
            text-align: center;
            color: #95a5a6;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Report Analisi SEO</h1>
        <p><strong>URL:</strong> {results['url']}</p>
        <p><strong>Data:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
        
        <div class="score">{score}/100</div>
        <div class="rating">{rating}</div>
        
        <div class="categories">
"""
        
        # Categorie
        for category, cat_score in results['category_scores'].items():
            html += f"""
            <div class="category">
                <h3>{category.capitalize()}</h3>
                <div class="category-score">{cat_score}/100</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {cat_score}%"></div>
                </div>
            </div>
"""
        
        html += """
        </div>
        
        <div class="issues">
"""
        
        # Issues
        issues = results['all_issues']
        critical = [i for i in issues if i['severity'] == 'critical']
        important = [i for i in issues if i['severity'] == 'important']
        minor = [i for i in issues if i['severity'] == 'minor']
        
        if critical:
            html += f"""
            <div class="issue-section">
                <h2>🔴 Problemi Critici ({len(critical)})</h2>
"""
            for issue in critical[:10]:
                html += f"""
                <div class="issue critical">
                    <div class="issue-message">{issue['message']}</div>
                    <div class="issue-recommendation">💡 {issue['recommendation']}</div>
                </div>
"""
            html += "</div>"
        
        if important:
            html += f"""
            <div class="issue-section">
                <h2>🟡 Problemi Importanti ({len(important)})</h2>
"""
            for issue in important[:10]:
                html += f"""
                <div class="issue important">
                    <div class="issue-message">{issue['message']}</div>
                    <div class="issue-recommendation">💡 {issue['recommendation']}</div>
                </div>
"""
            html += "</div>"
        
        html += """
        </div>
        
        <div class="footer">
            <p>Generato da SEO Analyzer Agent</p>
        </div>
    </div>
</body>
</html>
"""
        
        return html
    
    def _create_progress_bar(self, value: int, width: int = 20) -> str:
        """Crea barra progresso ASCII"""
        filled = int(value / 100 * width)
        bar = '█' * filled + '░' * (width - filled)
        return f"[{bar}]"

