"""
Mobile Analyzer - Analisi Mobile-Friendly e Responsive Design
Analizza viewport, touch targets, responsive design, usabilità mobile
"""

import re
from typing import Dict, List
from bs4 import BeautifulSoup


class MobileAnalyzer:
    """Analizzatore per compatibilità mobile"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str) -> Dict:
        """
        Analizza compatibilità mobile
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina
            
        Returns:
            Dizionario con risultati analisi mobile
        """
        soup = BeautifulSoup(html, 'lxml')
        
        results = {
            'url': url,
            'viewport': {},
            'responsive': {},
            'usability': {},
            'issues': [],
            'score': 0
        }
        
        # Analizza viewport
        results['viewport'] = self._analyze_viewport(soup)
        
        # Analizza responsive design
        results['responsive'] = self._analyze_responsive(soup, html)
        
        # Analizza usabilità mobile
        results['usability'] = self._analyze_usability(soup)
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_viewport(self, soup: BeautifulSoup) -> Dict:
        """Analizza meta viewport tag"""
        
        viewport = {
            'exists': False,
            'content': '',
            'is_valid': False,
            'score': 0
        }
        
        meta_viewport = soup.find('meta', attrs={'name': 'viewport'})
        
        if not meta_viewport or not meta_viewport.get('content'):
            self.issues.append({
                'severity': 'critical',
                'category': 'mobile',
                'message': 'Meta viewport tag mancante',
                'recommendation': 'Aggiungi: <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                'impact': 'Critico - Senza viewport, il sito non è mobile-friendly'
            })
            return viewport
        
        viewport['exists'] = True
        viewport['content'] = meta_viewport.get('content')
        
        # Verifica contenuto viewport
        recommended = self.config['mobile']['responsive']['viewport_config']
        
        # Controlla attributi essenziali
        has_device_width = 'width=device-width' in viewport['content']
        has_initial_scale = 'initial-scale=1' in viewport['content']
        
        if has_device_width and has_initial_scale:
            viewport['is_valid'] = True
            viewport['score'] = 100
        else:
            self.issues.append({
                'severity': 'important',
                'category': 'mobile',
                'message': 'Configurazione viewport non ottimale',
                'recommendation': f'Usa: {recommended}',
                'impact': 'Alto - Viewport corretto è essenziale per mobile'
            })
            viewport['score'] = 50
        
        # Verifica problemi comuni
        if 'maximum-scale' in viewport['content'] or 'user-scalable=no' in viewport['content']:
            self.issues.append({
                'severity': 'important',
                'category': 'mobile',
                'message': 'Viewport impedisce zoom (problemi accessibilità)',
                'recommendation': 'Rimuovi maximum-scale e user-scalable=no',
                'impact': 'Medio - Bloccare zoom danneggia accessibilità'
            })
            viewport['score'] = max(0, viewport['score'] - 30)
        
        return viewport
    
    def _analyze_responsive(self, soup: BeautifulSoup, html: str) -> Dict:
        """Analizza design responsive"""
        
        responsive = {
            'has_media_queries': False,
            'has_responsive_images': False,
            'has_flexible_layout': False,
            'score': 0
        }
        
        # Verifica media queries nei <style> inline
        style_tags = soup.find_all('style')
        for style in style_tags:
            style_content = style.get_text()
            if '@media' in style_content:
                responsive['has_media_queries'] = True
                break
        
        # Verifica media queries nei CSS esterni (non possiamo scaricarli qui)
        # Assumiamo presente se ci sono CSS link
        if not responsive['has_media_queries']:
            css_links = soup.find_all('link', rel='stylesheet')
            if css_links:
                # Potenzialmente ha media queries nei CSS esterni
                responsive['has_media_queries'] = True  # Assunzione ottimistica
        
        if not responsive['has_media_queries']:
            self.issues.append({
                'severity': 'critical',
                'category': 'mobile',
                'message': 'Nessuna media query CSS rilevata',
                'recommendation': 'Implementa design responsive con media queries (@media)',
                'impact': 'Critico - Senza media queries, layout non si adatta a mobile'
            })
        
        # Verifica immagini responsive
        images = soup.find_all('img')
        responsive_imgs = 0
        
        for img in images:
            # Verifica srcset o picture element
            if img.get('srcset') or img.parent.name == 'picture':
                responsive_imgs += 1
        
        if images:
            responsive['has_responsive_images'] = responsive_imgs > 0
            responsive_ratio = (responsive_imgs / len(images)) * 100
            
            if responsive_ratio < 50:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'mobile',
                    'message': f'Solo {responsive_ratio:.0f}% immagini responsive (srcset/picture)',
                    'recommendation': 'Usa srcset per servire immagini ottimizzate per device',
                    'impact': 'Medio - Immagini responsive riducono dati mobile'
                })
        
        # Verifica layout flessibile (euristica: presenza di flexbox/grid nel CSS inline)
        flexible_keywords = ['flex', 'grid', 'flex-direction', 'display: flex', 'display: grid']
        has_flexible = False
        
        for style in style_tags:
            style_content = style.get_text().lower()
            if any(keyword in style_content for keyword in flexible_keywords):
                has_flexible = True
                break
        
        responsive['has_flexible_layout'] = has_flexible
        
        # Score responsive
        score = 0
        if responsive['has_media_queries']:
            score += 50
        if responsive['has_responsive_images']:
            score += 25
        if responsive['has_flexible_layout']:
            score += 25
        
        responsive['score'] = score
        
        return responsive
    
    def _analyze_usability(self, soup: BeautifulSoup) -> Dict:
        """Analizza usabilità mobile"""
        
        usability = {
            'touch_targets': {},
            'font_size': {},
            'mobile_popups': {},
            'score': 100
        }
        
        # Analizza touch targets (bottoni, link)
        buttons = soup.find_all(['button', 'a'])
        min_touch_size = self.config['mobile']['usability']['touch_target_min_size']
        
        # Verifica se ci sono inline style con dimensioni troppo piccole
        small_targets = 0
        for btn in buttons:
            style = btn.get('style', '')
            # Cerca width/height in pixel
            width_match = re.search(r'width:\s*(\d+)px', style)
            height_match = re.search(r'height:\s*(\d+)px', style)
            
            if width_match or height_match:
                width = int(width_match.group(1)) if width_match else min_touch_size
                height = int(height_match.group(1)) if height_match else min_touch_size
                
                if width < min_touch_size or height < min_touch_size:
                    small_targets += 1
        
        if small_targets > 0:
            self.issues.append({
                'severity': 'important',
                'category': 'mobile',
                'message': f'{small_targets} elementi con touch target troppo piccolo',
                'recommendation': f'Assicura dimensione minima di {min_touch_size}x{min_touch_size}px',
                'impact': 'Alto - Touch target piccoli frustranti su mobile'
            })
            usability['score'] -= 20
        
        usability['touch_targets']['small_count'] = small_targets
        
        # Analizza font size
        min_font_size = self.config['mobile']['usability']['readable_font_size']
        
        # Cerca body font-size nel CSS inline
        style_tags = soup.find_all('style')
        has_readable_font = False
        
        for style in style_tags:
            style_content = style.get_text()
            # Cerca body { font-size: XXpx }
            body_font = re.search(r'body\s*{[^}]*font-size:\s*(\d+)px', style_content)
            if body_font:
                font_size = int(body_font.group(1))
                if font_size >= min_font_size:
                    has_readable_font = True
                else:
                    self.issues.append({
                        'severity': 'important',
                        'category': 'mobile',
                        'message': f'Font size troppo piccolo ({font_size}px, minimo {min_font_size}px)',
                        'recommendation': f'Usa almeno {min_font_size}px per testo body su mobile',
                        'impact': 'Medio - Font piccoli difficili da leggere su mobile'
                    })
                    usability['score'] -= 15
                break
        
        usability['font_size']['is_readable'] = has_readable_font
        
        # Verifica mobile popup interstitials (anti-pattern)
        # Cerca comuni pattern di popup/modal
        modals = soup.find_all(['div'], class_=re.compile(r'modal|popup|overlay|interstitial', re.I))
        if modals:
            # Verifica se sono "invasivi" (mostrati subito)
            # Questo è un'euristica semplificata
            self.issues.append({
                'severity': 'minor',
                'category': 'mobile',
                'message': 'Possibili popup interstitial rilevati',
                'recommendation': 'Evita popup che coprono contenuto principale su mobile',
                'impact': 'Medio - Google penalizza popup invasivi su mobile'
            })
            usability['score'] -= 10
        
        usability['mobile_popups']['detected'] = len(modals)
        
        return usability
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale mobile"""
        
        scores = []
        
        # Viewport (40%)
        viewport_score = results['viewport'].get('score', 0)
        scores.append(viewport_score * 0.4)
        
        # Responsive (35%)
        responsive_score = results['responsive'].get('score', 0)
        scores.append(responsive_score * 0.35)
        
        # Usability (25%)
        usability_score = results['usability'].get('score', 100)
        scores.append(usability_score * 0.25)
        
        total_score = sum(scores)
        return round(total_score)

