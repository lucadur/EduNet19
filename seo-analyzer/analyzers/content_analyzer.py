"""
Content Analyzer - Analisi Contenuti HTML e SEO On-Page
Analizza title, meta description, headings, keywords, densità
"""

import re
from typing import Dict, List, Tuple
from bs4 import BeautifulSoup
from collections import Counter


class ContentAnalyzer:
    """Analizzatore per contenuti SEO on-page"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str) -> Dict:
        """
        Analizza tutti gli aspetti dei contenuti SEO
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina analizzata
            
        Returns:
            Dizionario con risultati analisi
        """
        soup = BeautifulSoup(html, 'lxml')
        
        results = {
            'url': url,
            'title': self._analyze_title(soup),
            'meta_description': self._analyze_meta_description(soup),
            'headings': self._analyze_headings(soup),
            'keywords': self._analyze_keywords(soup),
            'content': self._analyze_content(soup),
            'issues': [],
            'score': 0
        }
        
        # Calcola score totale
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_title(self, soup: BeautifulSoup) -> Dict:
        """Analizza il tag <title>"""
        title_tag = soup.find('title')
        
        if not title_tag:
            self.issues.append({
                'severity': 'critical',
                'category': 'title',
                'message': 'Tag <title> mancante',
                'recommendation': 'Aggiungi un tag <title> con la primary keyword',
                'impact': 'Alto - Il title è uno dei fattori SEO più importanti'
            })
            return {'exists': False, 'score': 0}
        
        title = title_tag.get_text().strip()
        length = len(title)
        
        # Verifica lunghezza
        min_len = self.config['content']['title']['min_length']
        max_len = self.config['content']['title']['max_length']
        optimal_len = self.config['content']['title']['optimal_length']
        
        title_result = {
            'exists': True,
            'content': title,
            'length': length,
            'score': 0
        }
        
        if length < min_len:
            self.issues.append({
                'severity': 'important',
                'category': 'title',
                'message': f'Title troppo corto ({length} caratteri, minimo {min_len})',
                'recommendation': f'Espandi il title a {optimal_len} caratteri includendo la primary keyword',
                'impact': 'Medio - Title corto perde opportunità di ranking'
            })
            title_result['score'] = 30
        elif length > max_len:
            self.issues.append({
                'severity': 'important',
                'category': 'title',
                'message': f'Title troppo lungo ({length} caratteri, massimo {max_len})',
                'recommendation': f'Riduci il title a {optimal_len} caratteri, Google lo tronca nei risultati',
                'impact': 'Medio - Title troncato riduce CTR'
            })
            title_result['score'] = 50
        else:
            title_result['score'] = 100
            
        # Verifica se contiene numeri (ottimo per CTR)
        if re.search(r'\d+', title):
            title_result['has_numbers'] = True
            title_result['score'] = min(100, title_result['score'] + 10)
        
        return title_result
    
    def _analyze_meta_description(self, soup: BeautifulSoup) -> Dict:
        """Analizza la meta description"""
        meta_desc = soup.find('meta', {'name': 'description'})
        
        if not meta_desc or not meta_desc.get('content'):
            self.issues.append({
                'severity': 'critical',
                'category': 'meta',
                'message': 'Meta description mancante',
                'recommendation': 'Aggiungi una meta description persuasiva (120-155 caratteri) con primary keyword e call-to-action',
                'impact': 'Alto - La meta description influenza il CTR nei risultati di ricerca'
            })
            return {'exists': False, 'score': 0}
        
        description = meta_desc.get('content').strip()
        length = len(description)
        
        min_len = self.config['content']['meta_description']['min_length']
        max_len = self.config['content']['meta_description']['max_length']
        optimal_len = self.config['content']['meta_description']['optimal_length']
        
        desc_result = {
            'exists': True,
            'content': description,
            'length': length,
            'score': 0
        }
        
        if length < min_len:
            self.issues.append({
                'severity': 'important',
                'category': 'meta',
                'message': f'Meta description troppo corta ({length} caratteri, minimo {min_len})',
                'recommendation': f'Espandi a {optimal_len} caratteri con più dettagli e call-to-action',
                'impact': 'Medio - Description corta perde opportunità di persuasione'
            })
            desc_result['score'] = 40
        elif length > max_len:
            self.issues.append({
                'severity': 'important',
                'category': 'meta',
                'message': f'Meta description troppo lunga ({length} caratteri, massimo {max_len})',
                'recommendation': f'Riduci a {optimal_len} caratteri per evitare troncamento',
                'impact': 'Medio - Description troncata riduce efficacia'
            })
            desc_result['score'] = 60
        else:
            desc_result['score'] = 100
        
        # Verifica call-to-action
        cta_words = self.config['content']['meta_description']['persuasive_words']
        has_cta = any(word.lower() in description.lower() for word in cta_words)
        desc_result['has_call_to_action'] = has_cta
        
        if not has_cta:
            self.issues.append({
                'severity': 'minor',
                'category': 'meta',
                'message': 'Meta description senza call-to-action',
                'recommendation': f'Aggiungi parole persuasive come: {", ".join(cta_words[:3])}',
                'impact': 'Basso - CTA può aumentare il CTR del 5-10%'
            })
            desc_result['score'] = max(0, desc_result['score'] - 10)
        
        return desc_result
    
    def _analyze_headings(self, soup: BeautifulSoup) -> Dict:
        """Analizza la struttura dei headings (H1-H6)"""
        headings_result = {
            'h1': [],
            'h2': [],
            'h3': [],
            'h4': [],
            'h5': [],
            'h6': [],
            'score': 0,
            'structure_valid': True
        }
        
        # Trova tutti gli headings
        for level in range(1, 7):
            tags = soup.find_all(f'h{level}')
            headings_result[f'h{level}'] = [tag.get_text().strip() for tag in tags]
        
        # Verifica H1
        h1_count = len(headings_result['h1'])
        if h1_count == 0:
            self.issues.append({
                'severity': 'critical',
                'category': 'headings',
                'message': 'Nessun tag <h1> trovato',
                'recommendation': 'Aggiungi un tag <h1> unico con la primary keyword',
                'impact': 'Alto - H1 è fondamentale per SEO e struttura pagina'
            })
            headings_result['score'] = 0
        elif h1_count > 1:
            self.issues.append({
                'severity': 'important',
                'category': 'headings',
                'message': f'Troppi tag <h1> ({h1_count}, raccomandato: 1)',
                'recommendation': 'Mantieni solo un <h1> per pagina, usa <h2> per sottosezioni',
                'impact': 'Medio - Multipli H1 confondono i motori di ricerca'
            })
            headings_result['score'] = 50
        else:
            headings_result['score'] = 100
        
        # Verifica H2
        h2_count = len(headings_result['h2'])
        h2_min = self.config['content']['headings']['h2_min']
        h2_max = self.config['content']['headings']['h2_max']
        
        if h2_count < h2_min:
            self.issues.append({
                'severity': 'minor',
                'category': 'headings',
                'message': f'Pochi tag <h2> ({h2_count}, raccomandato: almeno {h2_min})',
                'recommendation': 'Aggiungi più sottosezioni H2 con secondary keywords',
                'impact': 'Basso - H2 aiutano struttura e keyword targeting'
            })
            headings_result['score'] = max(0, headings_result['score'] - 10)
        elif h2_count > h2_max:
            self.issues.append({
                'severity': 'minor',
                'category': 'headings',
                'message': f'Troppi tag <h2> ({h2_count}, raccomandato: max {h2_max})',
                'recommendation': 'Considera di usare <h3> per sotto-sottosezioni',
                'impact': 'Basso - Troppi H2 possono diluire focus keyword'
            })
        
        # Verifica struttura gerarchica
        if headings_result['h3'] and not headings_result['h2']:
            self.issues.append({
                'severity': 'minor',
                'category': 'headings',
                'message': 'H3 presente senza H2 (struttura non gerarchica)',
                'recommendation': 'Mantieni ordine gerarchico: H1 > H2 > H3',
                'impact': 'Basso - Struttura corretta migliora accessibilità'
            })
            headings_result['structure_valid'] = False
        
        return headings_result
    
    def _analyze_keywords(self, soup: BeautifulSoup) -> Dict:
        """Analizza densità keyword e distribuzione"""
        # Estrai tutto il testo
        text = soup.get_text()
        # Pulisci e normalizza
        text = re.sub(r'\s+', ' ', text).lower()
        
        # Conta parole totali
        words = text.split()
        total_words = len(words)
        
        keywords_result = {
            'total_words': total_words,
            'keyword_density': {},
            'score': 0
        }
        
        # Per questa demo, assumiamo di dover estrarre automaticamente le keyword
        # In produzione, le keyword potrebbero essere passate come parametro
        
        # Trova le parole più frequenti (escluse stop words comuni)
        stop_words = {'il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'da', 'a', 'in', 'con', 
                      'su', 'per', 'tra', 'fra', 'e', 'ed', 'o', 'od', 'del', 'dello', 
                      'della', 'dei', 'degli', 'delle', 'al', 'allo', 'alla', 'ai', 
                      'agli', 'alle', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
                      'un', 'uno', 'una', 'che', 'è', 'sono', 'più', 'come', 'anche',
                      'ma', 'se', 'non', 'quando', 'dove', 'chi', 'cosa'}
        
        filtered_words = [w for w in words if w not in stop_words and len(w) > 3]
        word_freq = Counter(filtered_words)
        
        # Top 5 parole più frequenti
        top_keywords = word_freq.most_common(5)
        
        for keyword, count in top_keywords:
            density = (count / total_words) * 100
            keywords_result['keyword_density'][keyword] = {
                'count': count,
                'density': round(density, 2)
            }
            
            # Verifica densità ottimale
            min_density = self.config['content']['keywords']['primary_keyword']['min_density']
            max_density = self.config['content']['keywords']['primary_keyword']['max_density']
            
            if density < min_density:
                # Keyword sotto-utilizzata (ma solo per la prima/principale)
                if keyword == top_keywords[0][0]:
                    self.issues.append({
                        'severity': 'minor',
                        'category': 'keywords',
                        'message': f'Keyword "{keyword}" sotto-utilizzata (densità {density:.2f}%)',
                        'recommendation': f'Aumenta utilizzo naturale (target: {min_density}-{max_density}%)',
                        'impact': 'Basso - Keyword density moderata aiuta ranking'
                    })
            elif density > max_density:
                # Keyword stuffing
                self.issues.append({
                    'severity': 'important',
                    'category': 'keywords',
                    'message': f'Keyword stuffing rilevato per "{keyword}" (densità {density:.2f}%)',
                    'recommendation': f'Riduci utilizzo per evitare penalizzazioni (max: {max_density}%)',
                    'impact': 'Alto - Keyword stuffing può causare penalizzazioni'
                })
        
        # Score basato su densità keyword principale
        if top_keywords:
            main_density = (top_keywords[0][1] / total_words) * 100
            min_d = self.config['content']['keywords']['primary_keyword']['min_density']
            max_d = self.config['content']['keywords']['primary_keyword']['max_density']
            optimal = self.config['content']['keywords']['primary_keyword']['optimal_density']
            
            if min_d <= main_density <= max_d:
                # Ottimale
                keywords_result['score'] = 100
            elif main_density < min_d:
                # Troppo bassa
                keywords_result['score'] = 60
            else:
                # Troppo alta
                keywords_result['score'] = 40
        
        return keywords_result
    
    def _analyze_content(self, soup: BeautifulSoup) -> Dict:
        """Analizza qualità e quantità del contenuto testuale"""
        text = soup.get_text()
        text_clean = re.sub(r'\s+', ' ', text).strip()
        words = text_clean.split()
        word_count = len(words)
        
        min_words = self.config['content']['text_content']['min_words_per_page']
        optimal_words = self.config['content']['text_content']['optimal_words']
        max_words = self.config['content']['text_content']['max_words']
        
        content_result = {
            'word_count': word_count,
            'score': 0
        }
        
        if word_count < min_words:
            self.issues.append({
                'severity': 'important',
                'category': 'content',
                'message': f'Contenuto insufficiente ({word_count} parole, minimo {min_words})',
                'recommendation': f'Espandi a {optimal_words} parole con contenuto originale e utile',
                'impact': 'Medio - Contenuto scarso riduce autorità della pagina'
            })
            content_result['score'] = (word_count / min_words) * 50
        elif word_count > max_words:
            self.issues.append({
                'severity': 'minor',
                'category': 'content',
                'message': f'Contenuto molto lungo ({word_count} parole, ideale {optimal_words})',
                'recommendation': 'Considera di dividere in più pagine o aggiungere indice',
                'impact': 'Basso - Contenuto troppo lungo può ridurre engagement'
            })
            content_result['score'] = 80
        else:
            # Score basato su vicinanza all'ottimale
            distance = abs(word_count - optimal_words)
            content_result['score'] = max(70, 100 - (distance / 10))
        
        # Analisi paragrafi
        paragraphs = soup.find_all('p')
        if paragraphs:
            avg_paragraph_words = sum(len(p.get_text().split()) for p in paragraphs) / len(paragraphs)
            max_paragraph = self.config['content']['text_content']['paragraph_max_words']
            
            if avg_paragraph_words > max_paragraph:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'content',
                    'message': f'Paragrafi troppo lunghi (media {avg_paragraph_words:.0f} parole)',
                    'recommendation': f'Dividi paragrafi lunghi (max {max_paragraph} parole)',
                    'impact': 'Basso - Paragrafi brevi migliorano leggibilità'
                })
        
        return content_result
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale per il contenuto"""
        scores = []
        weights = []
        
        if results['title'].get('score'):
            scores.append(results['title']['score'])
            weights.append(self.config['content']['title']['weight'])
        
        if results['meta_description'].get('score'):
            scores.append(results['meta_description']['score'])
            weights.append(self.config['content']['meta_description']['weight'])
        
        if results['headings'].get('score'):
            scores.append(results['headings']['score'])
            weights.append(self.config['content']['headings']['weight'])
        
        if results['keywords'].get('score'):
            scores.append(results['keywords']['score'])
            weights.append(self.config['content']['keywords']['weight'])
        
        if results['content'].get('score'):
            scores.append(results['content']['score'])
            weights.append(self.config['content']['text_content']['weight'])
        
        if not scores:
            return 0
        
        # Media ponderata
        total_weight = sum(weights)
        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        
        return round(weighted_sum / total_weight) if total_weight > 0 else 0

