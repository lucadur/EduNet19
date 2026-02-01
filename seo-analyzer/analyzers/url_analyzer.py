"""
URL Analyzer - Analisi Struttura URL e Sitemap
Analizza URL SEO-friendly, canonical tags, sitemap.xml, robots.txt
"""

import re
from typing import Dict, List
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import requests


class URLAnalyzer:
    """Analizzatore per struttura URL e configurazione sito"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str, check_sitemap: bool = True) -> Dict:
        """
        Analizza struttura URL e configurazione
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina analizzata
            check_sitemap: Se True, verifica esistenza sitemap.xml
            
        Returns:
            Dizionario con risultati analisi URL
        """
        soup = BeautifulSoup(html, 'lxml')
        
        results = {
            'url': url,
            'url_structure': {},
            'canonical': {},
            'sitemap': {},
            'robots': {},
            'issues': [],
            'score': 0
        }
        
        # Analizza struttura URL
        results['url_structure'] = self._analyze_url_structure(url)
        
        # Analizza canonical tag
        results['canonical'] = self._analyze_canonical(soup, url)
        
        # Verifica sitemap (se richiesto)
        if check_sitemap:
            results['sitemap'] = self._check_sitemap(url)
            results['robots'] = self._check_robots(url)
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_url_structure(self, url: str) -> Dict:
        """Analizza la struttura dell'URL"""
        
        parsed = urlparse(url)
        path = parsed.path
        query = parsed.query
        fragment = parsed.fragment
        
        structure = {
            'url': url,
            'path': path,
            'length': len(url),
            'has_query_params': bool(query),
            'has_fragment': bool(fragment),
            'depth': 0,
            'is_clean': True,
            'is_lowercase': True,
            'uses_hyphens': True,
            'has_special_chars': False,
            'score': 100
        }
        
        # Calcola profondità
        if path and path != '/':
            structure['depth'] = len([p for p in path.split('/') if p])
        
        # Verifica lunghezza
        max_len = self.config['urls']['structure']['max_length']
        optimal_len = self.config['urls']['structure']['optimal_length']
        
        if structure['length'] > max_len:
            self.issues.append({
                'severity': 'important',
                'category': 'url',
                'message': f'URL troppo lungo ({structure["length"]} caratteri, max {max_len})',
                'url': url,
                'recommendation': f'Riduci a max {optimal_len} caratteri',
                'impact': 'Medio - URL lunghi sono meno leggibili e condivisibili'
            })
            structure['score'] -= 20
            structure['is_clean'] = False
        
        # Verifica profondità
        max_depth = self.config['urls']['structure']['max_depth']
        if structure['depth'] > max_depth:
            self.issues.append({
                'severity': 'minor',
                'category': 'url',
                'message': f'URL troppo profondo ({structure["depth"]} livelli, max {max_depth})',
                'url': url,
                'recommendation': 'Riduci profondità struttura URL per migliore usabilità',
                'impact': 'Basso - URL profondi sono più difficili da navigare'
            })
            structure['score'] -= 10
        
        # Verifica lowercase
        if path != path.lower():
            structure['is_lowercase'] = False
            self.issues.append({
                'severity': 'important',
                'category': 'url',
                'message': 'URL contiene maiuscole',
                'url': url,
                'recommendation': 'Usa solo caratteri minuscoli negli URL',
                'impact': 'Medio - URL case-sensitive possono creare duplicati'
            })
            structure['score'] -= 15
            structure['is_clean'] = False
        
        # Verifica uso trattini vs underscore
        if '_' in path:
            structure['uses_hyphens'] = False
            self.issues.append({
                'severity': 'minor',
                'category': 'url',
                'message': 'URL usa underscore (_) invece di trattini (-)',
                'url': url,
                'recommendation': 'Sostituisci underscore con trattini',
                'impact': 'Basso - Google preferisce trattini per separare parole'
            })
            structure['score'] -= 5
        
        # Verifica caratteri speciali
        pattern = self.config['urls']['structure']['pattern']
        if not re.match(pattern, path) and path != '/':
            structure['has_special_chars'] = True
            self.issues.append({
                'severity': 'important',
                'category': 'url',
                'message': 'URL contiene caratteri speciali o non validi',
                'url': url,
                'recommendation': 'Usa solo lettere minuscole, numeri e trattini',
                'impact': 'Medio - Caratteri speciali causano problemi di codifica'
            })
            structure['score'] -= 20
            structure['is_clean'] = False
        
        # Verifica parametri query (evitare se possibile)
        if structure['has_query_params']:
            avoid_params = self.config['urls']['structure'].get('avoid_parameters', True)
            if avoid_params:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'url',
                    'message': 'URL contiene parametri query (?param=value)',
                    'url': url,
                    'recommendation': 'Preferisci URL pulite senza parametri query',
                    'impact': 'Basso - URL con parametri meno SEO-friendly'
                })
                structure['score'] -= 5
                structure['is_clean'] = False
        
        # Verifica se contiene keyword (euristica: almeno 3 parole significative)
        words = [w for w in re.split(r'[/-]', path) if len(w) > 2]
        if len(words) >= 2:
            structure['has_keywords'] = True
        else:
            self.issues.append({
                'severity': 'minor',
                'category': 'url',
                'message': 'URL non contiene parole chiave descrittive',
                'url': url,
                'recommendation': 'Usa URL descrittive con keyword pertinenti',
                'impact': 'Basso - URL con keyword aiutano ranking'
            })
            structure['score'] -= 10
        
        structure['score'] = max(0, structure['score'])
        return structure
    
    def _analyze_canonical(self, soup: BeautifulSoup, url: str) -> Dict:
        """Analizza canonical tag"""
        
        canonical = {
            'exists': False,
            'url': '',
            'is_self_referencing': False,
            'is_valid': False,
            'score': 0
        }
        
        link_canonical = soup.find('link', rel='canonical')
        
        if not link_canonical or not link_canonical.get('href'):
            self.issues.append({
                'severity': 'important',
                'category': 'url',
                'message': 'Tag canonical mancante',
                'url': url,
                'recommendation': f'Aggiungi: <link rel="canonical" href="{url}" />',
                'impact': 'Alto - Canonical previene problemi di contenuto duplicato'
            })
            return canonical
        
        canonical['exists'] = True
        canonical_url = link_canonical.get('href').strip()
        canonical['url'] = canonical_url
        
        # Risolvi URL assoluto
        absolute_canonical = urljoin(url, canonical_url)
        canonical['absolute_url'] = absolute_canonical
        
        # Verifica self-referencing
        parsed_page = urlparse(url)
        parsed_canonical = urlparse(absolute_canonical)
        
        # Confronta senza schema e trailing slash
        page_url_normalized = parsed_page.netloc + parsed_page.path.rstrip('/')
        canonical_url_normalized = parsed_canonical.netloc + parsed_canonical.path.rstrip('/')
        
        if page_url_normalized == canonical_url_normalized:
            canonical['is_self_referencing'] = True
            canonical['is_valid'] = True
            canonical['score'] = 100
        else:
            # Canonical punta altrove (potrebbe essere intenzionale)
            self.issues.append({
                'severity': 'minor',
                'category': 'url',
                'message': f'Canonical punta a URL diverso: {canonical_url}',
                'url': url,
                'recommendation': 'Verifica se è intenzionale o usa self-referencing',
                'impact': 'Basso - Canonical diverso consolida autorità su altra pagina'
            })
            canonical['score'] = 80
        
        # Verifica che canonical sia assoluto
        if not canonical_url.startswith('http'):
            self.issues.append({
                'severity': 'minor',
                'category': 'url',
                'message': 'Canonical usa URL relativo (meglio assoluto)',
                'url': url,
                'recommendation': 'Usa URL assoluto nel canonical',
                'impact': 'Basso - URL assoluto evita ambiguità'
            })
            canonical['score'] -= 10
        
        return canonical
    
    def _check_sitemap(self, url: str) -> Dict:
        """Verifica esistenza e validità sitemap.xml"""
        
        sitemap = {
            'exists': False,
            'url': '',
            'is_valid': False,
            'page_count': 0,
            'score': 0
        }
        
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        sitemap_url = f"{base_url}/sitemap.xml"
        
        try:
            response = requests.get(sitemap_url, timeout=10)
            
            if response.status_code == 200:
                sitemap['exists'] = True
                sitemap['url'] = sitemap_url
                
                # Verifica se è XML valido
                content = response.text
                if '<?xml' in content and '<urlset' in content:
                    sitemap['is_valid'] = True
                    
                    # Conta pagine (conteggio approssimativo)
                    sitemap['page_count'] = content.count('<url>')
                    
                    sitemap['score'] = 100
                else:
                    self.issues.append({
                        'severity': 'important',
                        'category': 'url',
                        'message': 'sitemap.xml esiste ma non è valido',
                        'url': sitemap_url,
                        'recommendation': 'Correggi formato sitemap.xml (deve essere XML valido)',
                        'impact': 'Alto - Sitemap invalida non aiuta indicizzazione'
                    })
                    sitemap['score'] = 30
            else:
                self.issues.append({
                    'severity': 'critical',
                    'category': 'url',
                    'message': 'sitemap.xml non trovato',
                    'url': sitemap_url,
                    'recommendation': 'Crea sitemap.xml per aiutare indicizzazione',
                    'impact': 'Alto - Sitemap facilita scoperta pagine dai motori di ricerca'
                })
        
        except Exception as e:
            self.issues.append({
                'severity': 'important',
                'category': 'url',
                'message': f'Errore verifica sitemap: {str(e)[:100]}',
                'url': sitemap_url,
                'recommendation': 'Verifica accessibilità sitemap.xml',
                'impact': 'Medio - Sitemap importante per grandi siti'
            })
        
        return sitemap
    
    def _check_robots(self, url: str) -> Dict:
        """Verifica esistenza robots.txt"""
        
        robots = {
            'exists': False,
            'url': '',
            'has_sitemap_reference': False,
            'score': 0
        }
        
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        robots_url = f"{base_url}/robots.txt"
        
        try:
            response = requests.get(robots_url, timeout=10)
            
            if response.status_code == 200:
                robots['exists'] = True
                robots['url'] = robots_url
                robots['score'] = 100
                
                content = response.text
                
                # Verifica se referenzia sitemap
                if 'Sitemap:' in content:
                    robots['has_sitemap_reference'] = True
                else:
                    self.issues.append({
                        'severity': 'minor',
                        'category': 'url',
                        'message': 'robots.txt non referenzia sitemap.xml',
                        'url': robots_url,
                        'recommendation': 'Aggiungi riga: Sitemap: https://tuosito.it/sitemap.xml',
                        'impact': 'Basso - Sitemap in robots.txt aiuta scoperta'
                    })
                    robots['score'] = 80
            else:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'url',
                    'message': 'robots.txt non trovato',
                    'url': robots_url,
                    'recommendation': 'Crea robots.txt con Sitemap e regole base',
                    'impact': 'Basso - robots.txt opzionale ma raccomandato'
                })
                robots['score'] = 50
        
        except Exception:
            # Silently fail per robots.txt
            robots['score'] = 50
        
        return robots
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale URL"""
        
        scores = []
        
        # Struttura URL (50%)
        url_score = results['url_structure'].get('score', 0)
        scores.append(url_score * 0.5)
        
        # Canonical (25%)
        canonical_score = results['canonical'].get('score', 0)
        scores.append(canonical_score * 0.25)
        
        # Sitemap (15%)
        sitemap_score = results['sitemap'].get('score', 0)
        scores.append(sitemap_score * 0.15)
        
        # Robots.txt (10%)
        robots_score = results['robots'].get('score', 50)  # Default neutro
        scores.append(robots_score * 0.1)
        
        total_score = sum(scores)
        return round(total_score)

