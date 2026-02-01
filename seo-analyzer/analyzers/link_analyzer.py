"""
Link Analyzer - Analisi Link Interni ed Esterni
Analizza anchor text, link rotti, struttura linking interna/esterna
"""

import re
from typing import Dict, List
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import requests
from collections import Counter


class LinkAnalyzer:
    """Analizzatore per link interni ed esterni"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str, check_broken: bool = False) -> Dict:
        """
        Analizza tutti i link nella pagina
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina (per distinguere interni/esterni)
            check_broken: Se True, verifica link rotti (più lento)
            
        Returns:
            Dizionario con risultati analisi link
        """
        soup = BeautifulSoup(html, 'lxml')
        
        links = soup.find_all('a', href=True)
        base_domain = urlparse(url).netloc
        
        results = {
            'total_links': len(links),
            'internal_links': [],
            'external_links': [],
            'broken_links': [],
            'anchor_texts': [],
            'issues': [],
            'score': 0,
            'summary': {
                'internal_count': 0,
                'external_count': 0,
                'broken_count': 0,
                'generic_anchors': 0,
                'descriptive_anchors': 0,
                'keyword_anchors': 0,
                'nofollow_external': 0
            }
        }
        
        for idx, link in enumerate(links):
            href = link.get('href', '').strip()
            anchor_text = link.get_text().strip()
            rel = link.get('rel', [])
            if isinstance(rel, str):
                rel = [rel]
            
            # Salta link vuoti o anchor
            if not href or href.startswith('#') or href.startswith('javascript:'):
                continue
            
            # Risolvi URL assoluto
            absolute_url = urljoin(url, href)
            link_domain = urlparse(absolute_url).netloc
            
            # Classifica link
            is_internal = link_domain == base_domain or link_domain == ''
            
            link_data = {
                'index': idx,
                'href': href,
                'absolute_url': absolute_url,
                'anchor_text': anchor_text,
                'is_internal': is_internal,
                'rel': rel,
                'has_nofollow': 'nofollow' in rel,
                'is_broken': False
            }
            
            # Analizza anchor text
            anchor_analysis = self._analyze_anchor_text(anchor_text, idx)
            link_data.update(anchor_analysis)
            results['anchor_texts'].append(anchor_analysis)
            
            if is_internal:
                results['internal_links'].append(link_data)
                results['summary']['internal_count'] += 1
            else:
                results['external_links'].append(link_data)
                results['summary']['external_count'] += 1
                
                # Verifica rel attributes per link esterni
                self._check_external_link_attributes(link_data, idx)
                
                if link_data['has_nofollow']:
                    results['summary']['nofollow_external'] += 1
            
            # Aggiorna summary anchor
            if anchor_analysis['is_generic']:
                results['summary']['generic_anchors'] += 1
            if anchor_analysis['is_descriptive']:
                results['summary']['descriptive_anchors'] += 1
            
            # Check broken link (opzionale, lento)
            if check_broken:
                is_broken = self._check_broken_link(absolute_url)
                link_data['is_broken'] = is_broken
                if is_broken:
                    results['broken_links'].append(link_data)
                    results['summary']['broken_count'] += 1
                    self.issues.append({
                        'severity': 'critical',
                        'category': 'links',
                        'message': f'Link rotto trovato: {href}',
                        'anchor_text': anchor_text,
                        'recommendation': 'Rimuovi o aggiorna il link',
                        'impact': 'Alto - Link rotti danneggiano esperienza utente e SEO'
                    })
        
        # Verifica numero di link interni
        self._check_internal_links_count(results['summary']['internal_count'])
        
        # Verifica numero di link esterni
        self._check_external_links_count(results['summary']['external_count'])
        
        # Verifica anchor text generici
        self._check_generic_anchors(results['summary'])
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_anchor_text(self, anchor: str, index: int) -> Dict:
        """Analizza qualità dell'anchor text"""
        
        generic_anchors = self.config['links']['internal']['avoid_generic_anchors']
        
        result = {
            'text': anchor,
            'length': len(anchor),
            'is_generic': anchor.lower() in [g.lower() for g in generic_anchors],
            'is_descriptive': False,
            'has_keywords': False
        }
        
        # Verifica se è descrittivo (almeno 2 parole significative)
        words = anchor.split()
        if len(words) >= 2:
            result['is_descriptive'] = True
        
        # Verifica lunghezza
        min_len = self.config['links']['anchor_text']['length_min']
        max_len = self.config['links']['anchor_text']['length_max']
        
        if len(anchor) < min_len:
            if not result['is_generic']:  # Generic anchor già segnalato
                self.issues.append({
                    'severity': 'minor',
                    'category': 'links',
                    'message': f'Anchor text troppo corto: "{anchor}"',
                    'recommendation': 'Usa anchor text più descrittivi (2-5 parole)',
                    'impact': 'Basso - Anchor descrittivi migliorano contesto per SEO'
                })
        elif len(anchor) > max_len:
            self.issues.append({
                'severity': 'minor',
                'category': 'links',
                'message': f'Anchor text troppo lungo: "{anchor[:50]}..."',
                'recommendation': f'Riduci a max {max_len} caratteri',
                'impact': 'Basso - Anchor troppo lunghi perdono efficacia'
            })
        
        return result
    
    def _check_external_link_attributes(self, link_data: Dict, index: int):
        """Verifica attributi rel per link esterni"""
        
        if not link_data['rel']:
            self.issues.append({
                'severity': 'minor',
                'category': 'links',
                'message': f'Link esterno senza attributo rel: {link_data["href"][:100]}',
                'anchor_text': link_data['anchor_text'],
                'recommendation': 'Aggiungi rel="noopener noreferrer" per sicurezza',
                'impact': 'Basso - Protegge da vulnerabilità e preserva referrer'
            })
        else:
            # Verifica che abbia almeno noopener o noreferrer per sicurezza
            recommended_rel = ['noopener', 'noreferrer']
            has_security = any(r in link_data['rel'] for r in recommended_rel)
            
            if not has_security:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'links',
                    'message': f'Link esterno senza rel di sicurezza: {link_data["href"][:100]}',
                    'recommendation': 'Aggiungi rel="noopener noreferrer"',
                    'impact': 'Basso - Previene vulnerabilità window.opener'
                })
    
    def _check_internal_links_count(self, count: int):
        """Verifica il numero di link interni"""
        min_internal = self.config['links']['internal']['min_per_page']
        max_internal = self.config['links']['internal']['max_per_page']
        
        if count < min_internal:
            self.issues.append({
                'severity': 'important',
                'category': 'links',
                'message': f'Pochi link interni ({count}, raccomandato: almeno {min_internal})',
                'recommendation': 'Aggiungi link interni a contenuti correlati per migliorare navigazione',
                'impact': 'Medio - Link interni distribuiscono authority e migliorano SEO'
            })
        elif count > max_internal:
            self.issues.append({
                'severity': 'minor',
                'category': 'links',
                'message': f'Troppi link interni ({count}, raccomandato: max {max_internal})',
                'recommendation': 'Riduci link interni per evitare diluizione di page rank',
                'impact': 'Basso - Troppi link possono sembrare spam'
            })
    
    def _check_external_links_count(self, count: int):
        """Verifica il numero di link esterni"""
        max_external = self.config['links']['external']['max_per_page']
        
        if count > max_external:
            self.issues.append({
                'severity': 'minor',
                'category': 'links',
                'message': f'Troppi link esterni ({count}, raccomandato: max {max_external})',
                'recommendation': 'Riduci link esterni o usa nofollow per alcuni',
                'impact': 'Medio - Troppi link esterni disperdono page rank'
            })
    
    def _check_generic_anchors(self, summary: Dict):
        """Verifica uso di anchor text generici"""
        total = summary['internal_count'] + summary['external_count']
        if total == 0:
            return
        
        generic_count = summary['generic_anchors']
        generic_ratio = (generic_count / total) * 100
        
        if generic_ratio > 20:  # Più del 20% sono generici
            self.issues.append({
                'severity': 'important',
                'category': 'links',
                'message': f'{generic_count} link con anchor text generico ({generic_ratio:.0f}%)',
                'recommendation': 'Usa anchor text descrittivi con parole chiave pertinenti',
                'impact': 'Medio - Anchor generici perdono valore SEO'
            })
    
    def _check_broken_link(self, url: str) -> bool:
        """Verifica se un link è rotto (404, timeout, etc.)"""
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            return response.status_code >= 400
        except requests.RequestException:
            return True
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale per i link"""
        total_links = results['total_links']
        
        if total_links == 0:
            return 50  # Punteggio neutro se non ci sono link
        
        summary = results['summary']
        
        scores = []
        
        # Link interni (peso 40%)
        internal_score = 100
        min_internal = self.config['links']['internal']['min_per_page']
        max_internal = self.config['links']['internal']['max_per_page']
        
        if summary['internal_count'] < min_internal:
            internal_score = (summary['internal_count'] / min_internal) * 100
        elif summary['internal_count'] > max_internal:
            excess = summary['internal_count'] - max_internal
            internal_score = max(50, 100 - (excess * 2))
        
        scores.append(internal_score * 0.4)
        
        # Anchor text (peso 30%)
        anchor_score = 100
        if total_links > 0:
            generic_ratio = (summary['generic_anchors'] / total_links)
            anchor_score = max(0, 100 - (generic_ratio * 100 * 2))
        scores.append(anchor_score * 0.3)
        
        # Link esterni (peso 20%)
        external_score = 100
        max_external = self.config['links']['external']['max_per_page']
        if summary['external_count'] > max_external:
            excess = summary['external_count'] - max_external
            external_score = max(60, 100 - (excess * 5))
        scores.append(external_score * 0.2)
        
        # Link rotti (peso 10%)
        broken_score = 100
        if summary['broken_count'] > 0:
            broken_score = max(0, 100 - (summary['broken_count'] * 20))
        scores.append(broken_score * 0.1)
        
        total_score = sum(scores)
        return round(total_score)

