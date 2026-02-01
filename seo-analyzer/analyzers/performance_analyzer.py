"""
Performance Analyzer - Analisi Performance e Velocità
Analizza velocità caricamento, Core Web Vitals, ottimizzazione risorse
"""

import time
import re
from typing import Dict, List
from bs4 import BeautifulSoup
from urllib.parse import urlparse
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class PerformanceAnalyzer:
    """Analizzatore per performance e velocità"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str, measure_live: bool = False) -> Dict:
        """
        Analizza performance della pagina
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina
            measure_live: Se True, misura tempi reali (più lento)
            
        Returns:
            Dizionario con risultati analisi performance
        """
        soup = BeautifulSoup(html, 'lxml')
        
        results = {
            'url': url,
            'loading': {},
            'resources': {},
            'caching': {},
            'core_web_vitals': {},
            'issues': [],
            'score': 0
        }
        
        # Analizza risorse
        results['resources'] = self._analyze_resources(soup, html)
        
        # Analizza caching (dal HTML)
        results['caching'] = self._analyze_caching(soup)
        
        # Misura tempo di caricamento (se richiesto)
        if measure_live and REQUESTS_AVAILABLE and url.startswith('http'):
            results['loading'] = self._measure_loading_time(url)
        
        # Analizza CSS e JS
        self._analyze_css_js(soup)
        
        # Verifica compressione
        self._check_compression(html)
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_resources(self, soup: BeautifulSoup, html: str) -> Dict:
        """Analizza risorse (CSS, JS, immagini, font)"""
        
        resources = {
            'css_files': [],
            'js_files': [],
            'font_files': [],
            'total_css': 0,
            'total_js': 0,
            'total_fonts': 0,
            'inline_css_size': 0,
            'inline_js_size': 0
        }
        
        # CSS esterni
        css_links = soup.find_all('link', rel='stylesheet')
        resources['css_files'] = [link.get('href') for link in css_links if link.get('href')]
        resources['total_css'] = len(resources['css_files'])
        
        # JS esterni
        js_scripts = soup.find_all('script', src=True)
        resources['js_files'] = [script.get('src') for script in js_scripts]
        resources['total_js'] = len(resources['js_files'])
        
        # CSS inline
        style_tags = soup.find_all('style')
        for style in style_tags:
            resources['inline_css_size'] += len(style.get_text())
        
        # JS inline
        inline_scripts = soup.find_all('script', src=False)
        for script in inline_scripts:
            resources['inline_js_size'] += len(script.get_text())
        
        # Font files
        font_links = soup.find_all('link', href=re.compile(r'\.(woff2?|ttf|eot|otf)$', re.I))
        resources['font_files'] = [link.get('href') for link in font_links if link.get('href')]
        resources['total_fonts'] = len(resources['total_fonts'])
        
        # Raccomandazioni
        if resources['total_css'] > 3:
            self.issues.append({
                'severity': 'important',
                'category': 'performance',
                'message': f'Troppi file CSS ({resources["total_css"]}, raccomandato: max 2-3)',
                'recommendation': 'Combina i file CSS in un unico bundle per ridurre richieste HTTP',
                'impact': 'Medio - Riduce richieste HTTP e migliora tempo di caricamento'
            })
        
        if resources['total_js'] > 5:
            self.issues.append({
                'severity': 'important',
                'category': 'performance',
                'message': f'Troppi file JavaScript ({resources["total_js"]}, raccomandato: max 3-5)',
                'recommendation': 'Combina e minifica i file JavaScript',
                'impact': 'Medio - Riduce richieste HTTP e parsing time'
            })
        
        # Verifica minificazione (euristica semplice)
        if resources['total_css'] > 0:
            # Controlla se almeno un CSS ha .min.css
            minified_css = any('.min.css' in css for css in resources['css_files'])
            if not minified_css:
                self.issues.append({
                    'severity': 'important',
                    'category': 'performance',
                    'message': 'CSS non minificato rilevato',
                    'recommendation': 'Minifica tutti i file CSS per ridurre dimensioni del 20-30%',
                    'impact': 'Medio - CSS minificato carica più velocemente'
                })
        
        if resources['total_js'] > 0:
            minified_js = any('.min.js' in js for js in resources['js_files'])
            if not minified_js:
                self.issues.append({
                    'severity': 'important',
                    'category': 'performance',
                    'message': 'JavaScript non minificato rilevato',
                    'recommendation': 'Minifica tutti i file JavaScript',
                    'impact': 'Medio - JS minificato riduce tempo di parsing'
                })
        
        # Inline CSS/JS eccessivo
        if resources['inline_css_size'] > 5000:  # >5KB
            self.issues.append({
                'severity': 'minor',
                'category': 'performance',
                'message': f'CSS inline eccessivo ({resources["inline_css_size"]} bytes)',
                'recommendation': 'Sposta CSS inline in file esterno cacheable',
                'impact': 'Basso - CSS esterno può essere cachato dal browser'
            })
        
        if resources['inline_js_size'] > 10000:  # >10KB
            self.issues.append({
                'severity': 'minor',
                'category': 'performance',
                'message': f'JavaScript inline eccessivo ({resources["inline_js_size"]} bytes)',
                'recommendation': 'Sposta JS inline in file esterno',
                'impact': 'Basso - JS esterno migliora caching'
            })
        
        return resources
    
    def _analyze_caching(self, soup: BeautifulSoup) -> Dict:
        """Analizza strategia di caching"""
        
        caching = {
            'has_service_worker': False,
            'has_cache_manifest': False,
            'score': 50  # Score neutro senza info complete
        }
        
        # Verifica service worker
        scripts = soup.find_all('script')
        for script in scripts:
            script_content = script.get_text()
            if 'serviceWorker' in script_content or 'navigator.serviceWorker' in script_content:
                caching['has_service_worker'] = True
                caching['score'] = 100
                break
        
        # Verifica cache manifest (obsoleto ma segnaliamo)
        manifest = soup.find('html', manifest=True)
        if manifest:
            caching['has_cache_manifest'] = True
            self.issues.append({
                'severity': 'minor',
                'category': 'performance',
                'message': 'Cache manifest rilevato (tecnologia obsoleta)',
                'recommendation': 'Sostituisci con Service Worker per PWA',
                'impact': 'Basso - Service Worker è lo standard moderno'
            })
        
        return caching
    
    def _measure_loading_time(self, url: str) -> Dict:
        """Misura tempo di caricamento reale"""
        
        loading = {
            'time_seconds': 0,
            'status_code': 0,
            'size_kb': 0
        }
        
        try:
            start = time.time()
            response = requests.get(url, timeout=30)
            end = time.time()
            
            loading['time_seconds'] = round(end - start, 2)
            loading['status_code'] = response.status_code
            loading['size_kb'] = round(len(response.content) / 1024, 2)
            
            # Verifica tempo di caricamento
            max_time = self.config['performance']['loading']['max_load_time_seconds']
            optimal_time = self.config['performance']['loading']['optimal_load_time_seconds']
            
            if loading['time_seconds'] > max_time:
                self.issues.append({
                    'severity': 'critical',
                    'category': 'performance',
                    'message': f'Tempo di caricamento eccessivo ({loading["time_seconds"]}s, max {max_time}s)',
                    'recommendation': f'Ottimizza per raggiungere {optimal_time}s: comprimi immagini, minifica CSS/JS, usa CDN',
                    'impact': 'Critico - Pagine lente aumentano bounce rate del 50%+'
                })
            elif loading['time_seconds'] > optimal_time:
                self.issues.append({
                    'severity': 'important',
                    'category': 'performance',
                    'message': f'Tempo di caricamento migliorabile ({loading["time_seconds"]}s, target {optimal_time}s)',
                    'recommendation': 'Ottimizza performance: lazy loading, comprimi risorse',
                    'impact': 'Medio - Ogni secondo extra riduce conversioni del 7%'
                })
            
        except Exception as e:
            loading['error'] = str(e)
            self.issues.append({
                'severity': 'critical',
                'category': 'performance',
                'message': f'Impossibile misurare tempo di caricamento: {str(e)[:100]}',
                'recommendation': 'Verifica che il sito sia accessibile',
                'impact': 'Critico - Sito potrebbe essere non raggiungibile'
            })
        
        return loading
    
    def _analyze_css_js(self, soup: BeautifulSoup):
        """Analizza posizionamento e attributi CSS/JS"""
        
        # Verifica CSS nel <head>
        head = soup.find('head')
        if head:
            css_in_head = head.find_all('link', rel='stylesheet')
            if len(css_in_head) == 0:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'performance',
                    'message': 'Nessun CSS nel <head>',
                    'recommendation': 'Carica CSS critico nel <head> per rendering veloce',
                    'impact': 'Medio - CSS nel head previene FOUC'
                })
        
        # Verifica JS con defer/async
        scripts = soup.find_all('script', src=True)
        scripts_without_defer_async = []
        
        for script in scripts:
            if not script.get('defer') and not script.get('async'):
                scripts_without_defer_async.append(script.get('src', 'inline')[:50])
        
        if scripts_without_defer_async:
            self.issues.append({
                'severity': 'important',
                'category': 'performance',
                'message': f'{len(scripts_without_defer_async)} script senza defer/async',
                'recommendation': 'Aggiungi defer o async per caricamento non-blocking',
                'impact': 'Alto - Script bloccanti rallentano il rendering della pagina'
            })
    
    def _check_compression(self, html: str):
        """Verifica se il contenuto può beneficiare di compressione"""
        
        html_size_kb = len(html.encode('utf-8')) / 1024
        
        # Stima risparmio con compressione (gzip tipicamente 70-80%)
        estimated_compressed = html_size_kb * 0.25
        savings = html_size_kb - estimated_compressed
        
        if html_size_kb > 100:  # >100KB di HTML
            self.issues.append({
                'severity': 'important',
                'category': 'performance',
                'message': f'HTML di grandi dimensioni ({html_size_kb:.0f}KB)',
                'recommendation': f'Abilita compressione Gzip/Brotli (risparmio stimato: {savings:.0f}KB)',
                'impact': 'Alto - Compressione riduce dimensioni del 70-80%'
            })
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale performance"""
        
        scores = []
        
        # Risorse (40%)
        resources = results['resources']
        resource_score = 100
        
        # Penalità per troppi file
        if resources['total_css'] > 3:
            resource_score -= (resources['total_css'] - 3) * 5
        if resources['total_js'] > 5:
            resource_score -= (resources['total_js'] - 5) * 3
        
        resource_score = max(0, resource_score)
        scores.append(resource_score * 0.4)
        
        # Caching (20%)
        cache_score = results['caching'].get('score', 50)
        scores.append(cache_score * 0.2)
        
        # Tempo di caricamento (40%)
        loading = results['loading']
        if 'time_seconds' in loading and loading['time_seconds'] > 0:
            load_time = loading['time_seconds']
            max_time = self.config['performance']['loading']['max_load_time_seconds']
            optimal = self.config['performance']['loading']['optimal_load_time_seconds']
            
            if load_time <= optimal:
                load_score = 100
            elif load_time <= max_time:
                load_score = 100 - ((load_time - optimal) / (max_time - optimal)) * 30
            else:
                # Oltre il massimo
                excess = load_time - max_time
                load_score = max(0, 70 - (excess * 10))
            
            scores.append(load_score * 0.4)
        else:
            # Senza misura reale, score neutro
            scores.append(50 * 0.4)
        
        total_score = sum(scores)
        return round(total_score)

