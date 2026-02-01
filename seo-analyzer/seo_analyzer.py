#!/usr/bin/env python3
"""
SEO Analyzer Agent - Agente Intelligente per Analisi SEO Completa
Analizza siti web statici per ottimizzazione SEO secondo best practices 2024-2025
"""

import argparse
import sys
import os
from pathlib import Path
import yaml
import time
from typing import Dict, List

# Import analyzers
from analyzers.content_analyzer import ContentAnalyzer
from analyzers.image_analyzer import ImageAnalyzer
from analyzers.link_analyzer import LinkAnalyzer
from analyzers.performance_analyzer import PerformanceAnalyzer
from analyzers.mobile_analyzer import MobileAnalyzer
from analyzers.url_analyzer import URLAnalyzer
from analyzers.schema_analyzer import SchemaAnalyzer

# Import utilities
from utils.crawler import Crawler
from utils.parser import HTMLParser
from utils.scorer import SEOScorer
from utils.reporter import SEOReporter

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("⚠️  Modulo 'requests' non disponibile. Installa con: pip install requests")


class SEOAnalyzer:
    """Agente principale per analisi SEO"""
    
    def __init__(self, config_path: str = 'config/seo_rules.yaml'):
        """
        Inizializza SEO Analyzer
        
        Args:
            config_path: Percorso file configurazione YAML
        """
        self.config = self._load_config(config_path)
        
        # Inizializza analyzer
        self.content_analyzer = ContentAnalyzer(self.config)
        self.image_analyzer = ImageAnalyzer(self.config)
        self.link_analyzer = LinkAnalyzer(self.config)
        self.performance_analyzer = PerformanceAnalyzer(self.config)
        self.mobile_analyzer = MobileAnalyzer(self.config)
        self.url_analyzer = URLAnalyzer(self.config)
        self.schema_analyzer = SchemaAnalyzer(self.config)
        
        # Utilities
        self.crawler = Crawler(self.config.get('advanced', {}).get('crawling', {}))
        self.parser = HTMLParser()
        self.scorer = SEOScorer(self.config)
        self.reporter = SEOReporter(self.config)
        
    def _load_config(self, config_path: str) -> Dict:
        """Carica configurazione da file YAML"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"❌ File configurazione non trovato: {config_path}")
            print("💡 Uso configurazione di default...")
            return self._default_config()
        except Exception as e:
            print(f"❌ Errore caricamento configurazione: {e}")
            sys.exit(1)
    
    def _default_config(self) -> Dict:
        """Configurazione di default minima"""
        return {
            'content': {
                'title': {'min_length': 30, 'max_length': 60, 'weight': 15},
                'meta_description': {'min_length': 120, 'max_length': 160, 'weight': 10},
                'headings': {'require_h1': True, 'h2_min': 2, 'weight': 8},
                'keywords': {'weight': 12},
                'text_content': {'min_words_per_page': 300, 'weight': 10}
            },
            'images': {
                'attributes': {'require_alt': True, 'weight': 8},
                'optimization': {'max_size_kb': 200, 'modern_formats': ['webp', 'avif']}
            },
            'scoring': {
                'category_weights': {
                    'content': 25, 'performance': 25, 'mobile': 15,
                    'images': 15, 'links': 10, 'structure': 10
                },
                'thresholds': {
                    'excellent': 90, 'good': 75, 'average': 60, 'poor': 40, 'critical': 0
                }
            }
        }
    
    def analyze_url(self, url: str, deep: bool = True) -> Dict:
        """
        Analizza una singola URL
        
        Args:
            url: URL da analizzare
            deep: Se True, esegue analisi approfondita (più lenta)
            
        Returns:
            Dizionario con risultati completi
        """
        if not REQUESTS_AVAILABLE:
            print("❌ Modulo 'requests' richiesto per analizzare URL")
            sys.exit(1)
        
        print(f"\n🔍 Analisi SEO: {url}")
        print("=" * 70)
        
        # Scarica HTML
        print("📥 Download HTML...")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            html = response.text
        except Exception as e:
            print(f"❌ Errore download: {e}")
            sys.exit(1)
        
        # Esegui analisi
        return self._analyze_html(html, url, deep)
    
    def analyze_file(self, file_path: str, url: str = None) -> Dict:
        """
        Analizza file HTML locale
        
        Args:
            file_path: Percorso file HTML
            url: URL simulato (opzionale)
            
        Returns:
            Dizionario con risultati completi
        """
        if not url:
            url = f"file://{os.path.abspath(file_path)}"
        
        print(f"\n🔍 Analisi file: {file_path}")
        print("=" * 70)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()
        except Exception as e:
            print(f"❌ Errore lettura file: {e}")
            sys.exit(1)
        
        return self._analyze_html(html, url, deep=False)
    
    def analyze_directory(self, dir_path: str, recursive: bool = True) -> List[Dict]:
        """
        Analizza tutti i file HTML in una directory
        
        Args:
            dir_path: Percorso directory
            recursive: Se True, analizza subdirectory
            
        Returns:
            Lista di risultati per ogni file
        """
        print(f"\n🔍 Analisi directory: {dir_path}")
        print("=" * 70)
        
        results = []
        pattern = '**/*.html' if recursive else '*.html'
        
        html_files = list(Path(dir_path).glob(pattern))
        total = len(html_files)
        
        if total == 0:
            print("⚠️  Nessun file HTML trovato")
            return results
        
        print(f"📁 Trovati {total} file HTML\n")
        
        for idx, file_path in enumerate(html_files, 1):
            print(f"[{idx}/{total}] Analisi: {file_path.name}")
            result = self.analyze_file(str(file_path))
            results.append(result)
        
        return results
    
    def analyze_sitemap(self, sitemap_url: str, max_pages: int = 100) -> List[Dict]:
        """
        Analizza tutte le pagine da sitemap.xml
        
        Args:
            sitemap_url: URL del sitemap.xml
            max_pages: Numero massimo di pagine da analizzare
            
        Returns:
            Lista di risultati per ogni pagina
        """
        print(f"\n🔍 Analisi da sitemap: {sitemap_url}")
        print("=" * 70)
        
        # Parse sitemap
        try:
            response = requests.get(sitemap_url, timeout=30)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'xml')
            
            urls = [loc.text for loc in soup.find_all('loc')]
            urls = urls[:max_pages]
            
            print(f"📄 Trovate {len(urls)} URL nel sitemap\n")
        
        except Exception as e:
            print(f"❌ Errore parsing sitemap: {e}")
            return []
        
        # Analizza ogni URL
        results = []
        for idx, url in enumerate(urls, 1):
            print(f"\n[{idx}/{len(urls)}] Analisi: {url}")
            result = self.analyze_url(url, deep=False)
            results.append(result)
            time.sleep(1)  # Rate limiting
        
        return results
    
    def _analyze_html(self, html: str, url: str, deep: bool = True) -> Dict:
        """
        Analizza HTML con tutti gli analyzer
        
        Args:
            html: Contenuto HTML
            url: URL della pagina
            deep: Analisi approfondita
            
        Returns:
            Risultati completi analisi
        """
        results = {
            'url': url,
            'timestamp': time.time(),
            'content': {},
            'images': {},
            'links': {},
            'performance': {},
            'mobile': {},
            'structure': {},
            'schema': {},
            'category_scores': {},
            'global_score': 0,
            'rating': '',
            'rating_emoji': '',
            'all_issues': []
        }
        
        # 1. Analisi Contenuti
        print("📝 Analisi contenuti...")
        results['content'] = self.content_analyzer.analyze(html, url)
        results['category_scores']['content'] = results['content']['score']
        results['all_issues'].extend(results['content']['issues'])
        
        # 2. Analisi Immagini
        print("🖼️  Analisi immagini...")
        results['images'] = self.image_analyzer.analyze(html, url, check_image_size=deep)
        results['category_scores']['images'] = results['images']['score']
        results['all_issues'].extend(results['images']['issues'])
        
        # 3. Analisi Link
        print("🔗 Analisi link...")
        results['links'] = self.link_analyzer.analyze(html, url, check_broken=deep)
        results['category_scores']['links'] = results['links']['score']
        results['all_issues'].extend(results['links']['issues'])
        
        # 4. Analisi Performance
        print("⚡ Analisi performance...")
        results['performance'] = self.performance_analyzer.analyze(html, url, measure_live=deep)
        results['category_scores']['performance'] = results['performance']['score']
        results['all_issues'].extend(results['performance']['issues'])
        
        # 5. Analisi Mobile
        print("📱 Analisi mobile...")
        results['mobile'] = self.mobile_analyzer.analyze(html, url)
        results['category_scores']['mobile'] = results['mobile']['score']
        results['all_issues'].extend(results['mobile']['issues'])
        
        # 6. Analisi Struttura URL
        print("🔍 Analisi struttura URL...")
        results['structure'] = self.url_analyzer.analyze(html, url, check_sitemap=deep)
        results['category_scores']['structure'] = results['structure']['score']
        results['all_issues'].extend(results['structure']['issues'])
        
        # 7. Analisi Schema Markup
        print("📊 Analisi schema markup...")
        results['schema'] = self.schema_analyzer.analyze(html, url)
        # Schema non ha peso diretto nel category_scores, ma contribuisce al contenuto
        results['all_issues'].extend(results['schema']['issues'])
        
        # Calcola score globale
        results['global_score'] = self.scorer.calculate_global_score(results['category_scores'])
        results['rating'] = self.scorer.get_rating(results['global_score'])
        results['rating_emoji'] = self.scorer.get_rating_emoji(results['global_score'])
        
        print(f"\n✅ Analisi completata - Score: {results['global_score']}/100 ({results['rating']})")
        
        return results
    
    def generate_report(self, results: Dict, format: str = 'console', output_file: str = None):
        """
        Genera report dai risultati
        
        Args:
            results: Risultati analisi
            format: Formato output ('console', 'json', 'html', 'pdf')
            output_file: File di output (se None, stampa su console)
        """
        if format == 'console':
            report = self.reporter.generate_console_report(results)
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"\n💾 Report salvato: {output_file}")
            else:
                print("\n" + report)
        
        elif format == 'json':
            report = self.reporter.generate_json_report(results)
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"\n💾 Report JSON salvato: {output_file}")
            else:
                print(report)
        
        elif format == 'html':
            report = self.reporter.generate_html_report(results)
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"\n💾 Report HTML salvato: {output_file}")
            else:
                print("⚠️  Specifica --save per salvare report HTML")
        
        else:
            print(f"❌ Formato non supportato: {format}")


def main():
    """Entry point CLI"""
    parser = argparse.ArgumentParser(
        description='🔍 SEO Analyzer Agent - Analisi SEO Completa per Siti Web Statici',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Esempi:
  %(prog)s --url https://example.com
  %(prog)s --url https://example.com --output html --save report.html
  %(prog)s --file index.html
  %(prog)s --local-dir ./build --recursive
  %(prog)s --sitemap https://example.com/sitemap.xml
  %(prog)s --url https://example.com --quick
        """
    )
    
    # Input
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--url', help='URL da analizzare')
    input_group.add_argument('--file', help='File HTML locale da analizzare')
    input_group.add_argument('--local-dir', help='Directory con file HTML')
    input_group.add_argument('--sitemap', help='URL sitemap.xml')
    
    # Opzioni analisi
    parser.add_argument('--recursive', action='store_true', 
                        help='Analizza subdirectory (con --local-dir)')
    parser.add_argument('--quick', action='store_true',
                        help='Analisi veloce (salta verifiche lente)')
    parser.add_argument('--max-pages', type=int, default=100,
                        help='Max pagine da analizzare (default: 100)')
    
    # Output
    parser.add_argument('--output', choices=['console', 'json', 'html', 'pdf'],
                        default='console', help='Formato output (default: console)')
    parser.add_argument('--save', help='Salva report su file')
    
    # Config
    parser.add_argument('--config', default='config/seo_rules.yaml',
                        help='File configurazione (default: config/seo_rules.yaml)')
    
    args = parser.parse_args()
    
    # Inizializza analyzer
    analyzer = SEOAnalyzer(config_path=args.config)
    
    # Esegui analisi
    results = None
    
    if args.url:
        results = analyzer.analyze_url(args.url, deep=not args.quick)
    
    elif args.file:
        results = analyzer.analyze_file(args.file)
    
    elif args.local_dir:
        all_results = analyzer.analyze_directory(args.local_dir, recursive=args.recursive)
        
        # Genera report aggregato
        if all_results:
            avg_score = sum(r['global_score'] for r in all_results) / len(all_results)
            print(f"\n📊 RIEPILOGO DIRECTORY")
            print("=" * 70)
            print(f"File analizzati: {len(all_results)}")
            print(f"Score medio: {avg_score:.1f}/100")
            
            # Mostra top/worst performing
            sorted_results = sorted(all_results, key=lambda x: x['global_score'], reverse=True)
            print(f"\n🏆 Migliori:")
            for r in sorted_results[:3]:
                print(f"  {r['global_score']}/100 - {Path(r['url']).name}")
            
            print(f"\n⚠️  Da migliorare:")
            for r in sorted_results[-3:]:
                print(f"  {r['global_score']}/100 - {Path(r['url']).name}")
        
        return
    
    elif args.sitemap:
        all_results = analyzer.analyze_sitemap(args.sitemap, max_pages=args.max_pages)
        
        if all_results:
            avg_score = sum(r['global_score'] for r in all_results) / len(all_results)
            print(f"\n📊 RIEPILOGO SITEMAP")
            print("=" * 70)
            print(f"Pagine analizzate: {len(all_results)}")
            print(f"Score medio: {avg_score:.1f}/100")
        
        return
    
    # Genera report
    if results:
        analyzer.generate_report(results, format=args.output, output_file=args.save)


if __name__ == '__main__':
    main()

