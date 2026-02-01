"""
Schema Analyzer - Analisi Schema Markup e Dati Strutturati
Analizza JSON-LD, Microdata, RDFa per rich snippets
"""

import json
import re
from typing import Dict, List
from bs4 import BeautifulSoup


class SchemaAnalyzer:
    """Analizzatore per schema markup e dati strutturati"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str) -> Dict:
        """
        Analizza schema markup
        
        Args:
            html: Contenuto HTML della pagina
            url: URL della pagina
            
        Returns:
            Dizionario con risultati analisi schema
        """
        soup = BeautifulSoup(html, 'lxml')
        
        results = {
            'url': url,
            'json_ld': [],
            'microdata': [],
            'rdfa': [],
            'has_schema': False,
            'schema_types': [],
            'issues': [],
            'score': 0
        }
        
        # Analizza JSON-LD
        results['json_ld'] = self._analyze_json_ld(soup)
        
        # Analizza Microdata
        results['microdata'] = self._analyze_microdata(soup)
        
        # Analizza RDFa
        results['rdfa'] = self._analyze_rdfa(soup)
        
        # Verifica presenza schema
        results['has_schema'] = len(results['json_ld']) > 0 or \
                                len(results['microdata']) > 0 or \
                                len(results['rdfa']) > 0
        
        # Raccogli tipi schema
        schema_types = []
        for schema in results['json_ld']:
            if '@type' in schema:
                schema_types.append(schema['@type'])
        results['schema_types'] = schema_types
        
        # Verifica se schema è presente
        if not results['has_schema']:
            self.issues.append({
                'severity': 'important',
                'category': 'schema',
                'message': 'Nessun schema markup rilevato',
                'url': url,
                'recommendation': 'Aggiungi schema.org markup in formato JSON-LD per rich snippets',
                'impact': 'Alto - Schema markup migliora visibilità nei risultati di ricerca'
            })
        else:
            # Verifica tipi appropriati
            self._check_schema_types(results['schema_types'])
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_json_ld(self, soup: BeautifulSoup) -> List[Dict]:
        """Analizza JSON-LD schema markup"""
        
        json_ld_schemas = []
        
        # Trova tutti i script type application/ld+json
        scripts = soup.find_all('script', type='application/ld+json')
        
        for script in scripts:
            try:
                content = script.string
                if content:
                    schema = json.loads(content)
                    json_ld_schemas.append(schema)
                    
                    # Valida schema base
                    if '@context' not in schema:
                        self.issues.append({
                            'severity': 'minor',
                            'category': 'schema',
                            'message': 'Schema JSON-LD senza @context',
                            'recommendation': 'Aggiungi "@context": "https://schema.org"',
                            'impact': 'Basso - @context necessario per validità schema'
                        })
                    
                    if '@type' not in schema:
                        self.issues.append({
                            'severity': 'minor',
                            'category': 'schema',
                            'message': 'Schema JSON-LD senza @type',
                            'recommendation': 'Specifica @type (es: Organization, WebPage, Article)',
                            'impact': 'Basso - @type identifica tipo di entità'
                        })
            
            except json.JSONDecodeError as e:
                self.issues.append({
                    'severity': 'important',
                    'category': 'schema',
                    'message': f'JSON-LD non valido: {str(e)[:100]}',
                    'recommendation': 'Correggi sintassi JSON nel tag <script type="application/ld+json">',
                    'impact': 'Alto - Schema invalido viene ignorato dai motori di ricerca'
                })
        
        return json_ld_schemas
    
    def _analyze_microdata(self, soup: BeautifulSoup) -> List[Dict]:
        """Analizza Microdata (itemscope, itemprop)"""
        
        microdata_items = []
        
        # Trova tutti gli elementi con itemscope
        items = soup.find_all(attrs={'itemscope': True})
        
        for item in items:
            itemtype = item.get('itemtype', '')
            
            microdata = {
                'itemtype': itemtype,
                'properties': {}
            }
            
            # Trova tutte le proprietà
            props = item.find_all(attrs={'itemprop': True})
            for prop in props:
                prop_name = prop.get('itemprop')
                prop_value = prop.get('content') or prop.get_text().strip()
                microdata['properties'][prop_name] = prop_value
            
            microdata_items.append(microdata)
        
        if microdata_items:
            # Microdata è meno preferito rispetto a JSON-LD
            self.issues.append({
                'severity': 'minor',
                'category': 'schema',
                'message': 'Usa Microdata (raccomandato: JSON-LD)',
                'recommendation': 'Considera migrazione a JSON-LD per facilità manutenzione',
                'impact': 'Basso - JSON-LD è il formato preferito da Google'
            })
        
        return microdata_items
    
    def _analyze_rdfa(self, soup: BeautifulSoup) -> List[Dict]:
        """Analizza RDFa markup"""
        
        rdfa_items = []
        
        # Trova elementi con attributi RDFa
        items = soup.find_all(attrs={'typeof': True})
        
        for item in items:
            typeof = item.get('typeof', '')
            
            rdfa = {
                'typeof': typeof,
                'properties': {}
            }
            
            # Trova proprietà
            props = item.find_all(attrs={'property': True})
            for prop in props:
                prop_name = prop.get('property')
                prop_value = prop.get('content') or prop.get_text().strip()
                rdfa['properties'][prop_name] = prop_value
            
            rdfa_items.append(rdfa)
        
        if rdfa_items:
            self.issues.append({
                'severity': 'minor',
                'category': 'schema',
                'message': 'Usa RDFa (raccomandato: JSON-LD)',
                'recommendation': 'Considera migrazione a JSON-LD',
                'impact': 'Basso - JSON-LD più semplice da implementare e mantenere'
            })
        
        return rdfa_items
    
    def _check_schema_types(self, schema_types: List[str]):
        """Verifica tipi di schema appropriati"""
        
        appropriate_types = self.config['schema']['structured_data'].get('appropriate_types', [])
        
        if not schema_types:
            return
        
        # Verifica se usa tipi appropriati comuni
        common_types = ['Organization', 'WebPage', 'Article', 'BreadcrumbList', 'FAQPage', 
                        'Product', 'Review', 'Event', 'LocalBusiness']
        
        has_common = any(st in common_types for st in schema_types)
        
        if not has_common:
            self.issues.append({
                'severity': 'minor',
                'category': 'schema',
                'message': f'Schema types rilevati: {", ".join(schema_types)}',
                'recommendation': f'Considera aggiungere: {", ".join(appropriate_types[:3])}',
                'impact': 'Basso - Tipi schema appropriati migliorano rich snippets'
            })
        
        # Verifica Organization schema
        if 'Organization' not in schema_types and 'LocalBusiness' not in schema_types:
            self.issues.append({
                'severity': 'minor',
                'category': 'schema',
                'message': 'Schema Organization mancante',
                'recommendation': 'Aggiungi schema Organization con logo, name, url per knowledge panel',
                'impact': 'Medio - Organization schema aiuta knowledge graph Google'
            })
        
        # Verifica BreadcrumbList per navigazione
        if 'BreadcrumbList' not in schema_types:
            self.issues.append({
                'severity': 'minor',
                'category': 'schema',
                'message': 'Schema BreadcrumbList mancante',
                'recommendation': 'Aggiungi breadcrumb schema per navigazione rich snippet',
                'impact': 'Basso - Breadcrumb appaiono nei risultati di ricerca'
            })
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score schema markup"""
        
        if not results['has_schema']:
            return 0
        
        score = 50  # Base score per presenza schema
        
        # Bonus per JSON-LD (formato preferito)
        if results['json_ld']:
            score += 30
            
            # Bonus per schema validi
            valid_schemas = sum(1 for s in results['json_ld'] 
                              if '@context' in s and '@type' in s)
            if valid_schemas == len(results['json_ld']):
                score += 10
        
        # Bonus minore per microdata/rdfa
        if results['microdata']:
            score += 10
        if results['rdfa']:
            score += 10
        
        # Bonus per tipi schema appropriati
        appropriate_types = ['Organization', 'WebPage', 'Article', 'BreadcrumbList']
        has_appropriate = any(st in results['schema_types'] for st in appropriate_types)
        if has_appropriate:
            score += 10
        
        return min(100, score)

