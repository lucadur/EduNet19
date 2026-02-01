"""
Image Analyzer - Analisi Immagini per SEO
Analizza attributi alt, nomi file, dimensioni, compressione, lazy loading
"""

import re
import os
from typing import Dict, List
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote
try:
    from PIL import Image
    import requests
    from io import BytesIO
    IMAGING_AVAILABLE = True
except ImportError:
    IMAGING_AVAILABLE = False


class ImageAnalyzer:
    """Analizzatore per immagini SEO"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
        
    def analyze(self, html: str, url: str, check_image_size: bool = True) -> Dict:
        """
        Analizza tutte le immagini nella pagina
        
        Args:
            html: Contenuto HTML della pagina
            url: URL base per risolvere percorsi relativi
            check_image_size: Se True, scarica immagini per verificare dimensioni
            
        Returns:
            Dizionario con risultati analisi immagini
        """
        soup = BeautifulSoup(html, 'lxml')
        
        images = soup.find_all('img')
        
        results = {
            'total_images': len(images),
            'images': [],
            'issues': [],
            'score': 0,
            'summary': {
                'missing_alt': 0,
                'empty_alt': 0,
                'decorative_images': 0,
                'optimized_names': 0,
                'lazy_loaded': 0,
                'modern_format': 0,
                'oversized': 0
            }
        }
        
        for idx, img in enumerate(images):
            img_analysis = self._analyze_single_image(
                img, url, idx, check_image_size
            )
            results['images'].append(img_analysis)
            
            # Aggiorna summary
            if not img_analysis['has_alt']:
                results['summary']['missing_alt'] += 1
            elif img_analysis['alt_text'] == '':
                results['summary']['empty_alt'] += 1
                results['summary']['decorative_images'] += 1
            
            if img_analysis['filename_optimized']:
                results['summary']['optimized_names'] += 1
            
            if img_analysis['is_lazy_loaded']:
                results['summary']['lazy_loaded'] += 1
            
            if img_analysis['is_modern_format']:
                results['summary']['modern_format'] += 1
            
            if img_analysis.get('is_oversized'):
                results['summary']['oversized'] += 1
        
        # Calcola score
        results['score'] = self._calculate_score(results)
        results['issues'] = self.issues
        
        return results
    
    def _analyze_single_image(
        self, 
        img_tag, 
        base_url: str, 
        index: int,
        check_size: bool
    ) -> Dict:
        """Analizza una singola immagine"""
        
        src = img_tag.get('src', '')
        alt = img_tag.get('alt')
        title = img_tag.get('title')
        loading = img_tag.get('loading')
        width = img_tag.get('width')
        height = img_tag.get('height')
        
        result = {
            'index': index,
            'src': src,
            'alt_text': alt if alt is not None else '',
            'has_alt': alt is not None,
            'has_title': title is not None,
            'title_text': title if title else '',
            'is_lazy_loaded': loading == 'lazy',
            'has_dimensions': width and height,
            'width': width,
            'height': height,
            'filename': '',
            'filename_optimized': False,
            'is_modern_format': False,
            'format': None
        }
        
        # Analizza filename
        if src:
            parsed = urlparse(src)
            filename = os.path.basename(unquote(parsed.path))
            result['filename'] = filename
            
            # Verifica se il nome è ottimizzato
            result['filename_optimized'] = self._is_filename_optimized(filename)
            
            # Verifica formato
            ext = os.path.splitext(filename)[1].lower().lstrip('.')
            result['format'] = ext
            modern_formats = self.config['images']['optimization']['modern_formats']
            result['is_modern_format'] = ext in modern_formats
        
        # Verifica attributo alt
        if not result['has_alt']:
            self.issues.append({
                'severity': 'critical',
                'category': 'images',
                'message': f'Immagine #{index + 1} senza attributo alt',
                'image_src': src[:100],
                'recommendation': 'Aggiungi attributo alt descrittivo con keyword rilevanti',
                'impact': 'Alto - Alt text è fondamentale per SEO immagini e accessibilità'
            })
        elif alt == '':
            # Alt vuoto = immagine decorativa (ok)
            pass
        else:
            # Verifica qualità alt text
            alt_length = len(alt)
            min_len = self.config['images']['attributes']['alt_min_length']
            max_len = self.config['images']['attributes']['alt_max_length']
            
            if alt_length < min_len:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'images',
                    'message': f'Alt text troppo corto per immagine #{index + 1} ({alt_length} caratteri)',
                    'image_src': src[:100],
                    'recommendation': f'Espandi alt text a {min_len}-{max_len} caratteri con descrizione dettagliata',
                    'impact': 'Basso - Alt text più descrittivi migliorano ranking immagini'
                })
            elif alt_length > max_len:
                self.issues.append({
                    'severity': 'minor',
                    'category': 'images',
                    'message': f'Alt text troppo lungo per immagine #{index + 1} ({alt_length} caratteri)',
                    'image_src': src[:100],
                    'recommendation': f'Riduci alt text a max {max_len} caratteri',
                    'impact': 'Basso - Alt text troppo lunghi possono essere ignorati'
                })
        
        # Verifica filename
        if not result['filename_optimized']:
            self.issues.append({
                'severity': 'minor',
                'category': 'images',
                'message': f'Nome file non ottimizzato: "{result["filename"]}"',
                'image_src': src[:100],
                'recommendation': 'Rinomina con parole-chiave-separate-da-trattini.jpg',
                'impact': 'Basso - Nomi file SEO-friendly aiutano ranking immagini'
            })
        
        # Verifica lazy loading
        if not result['is_lazy_loaded']:
            self.issues.append({
                'severity': 'minor',
                'category': 'images',
                'message': f'Immagine #{index + 1} senza lazy loading',
                'image_src': src[:100],
                'recommendation': 'Aggiungi attributo loading="lazy" per migliorare performance',
                'impact': 'Medio - Lazy loading migliora velocità caricamento pagina'
            })
        
        # Verifica dimensioni specificate
        if not result['has_dimensions']:
            self.issues.append({
                'severity': 'minor',
                'category': 'images',
                'message': f'Immagine #{index + 1} senza width/height',
                'image_src': src[:100],
                'recommendation': 'Specifica width e height per evitare layout shift',
                'impact': 'Medio - Previene CLS (Cumulative Layout Shift)'
            })
        
        # Verifica formato moderno
        if result['format'] and result['format'] in ['jpg', 'jpeg', 'png', 'gif']:
            self.issues.append({
                'severity': 'minor',
                'category': 'images',
                'message': f'Immagine #{index + 1} in formato obsoleto ({result["format"]})',
                'image_src': src[:100],
                'recommendation': 'Converti in WebP o AVIF per ridurre dimensioni del 25-50%',
                'impact': 'Medio - Formati moderni migliorano performance'
            })
        
        # Verifica dimensione file (se richiesto e possibile)
        if check_size and IMAGING_AVAILABLE and src and src.startswith('http'):
            try:
                size_kb = self._check_image_size(src)
                if size_kb:
                    result['size_kb'] = size_kb
                    max_size = self.config['images']['optimization']['max_size_kb']
                    
                    if size_kb > max_size:
                        result['is_oversized'] = True
                        self.issues.append({
                            'severity': 'important',
                            'category': 'images',
                            'message': f'Immagine #{index + 1} troppo grande ({size_kb:.0f}KB, max {max_size}KB)',
                            'image_src': src[:100],
                            'recommendation': f'Comprimi l\'immagine (target: {max_size}KB, risparmio: {size_kb - max_size:.0f}KB)',
                            'impact': 'Alto - Immagini pesanti rallentano caricamento pagina'
                        })
            except Exception:
                # Silently fail se non riesce a scaricare
                pass
        
        return result
    
    def _is_filename_optimized(self, filename: str) -> bool:
        """Verifica se il nome file è ottimizzato per SEO"""
        if not filename:
            return False
        
        # Rimuovi estensione
        name = os.path.splitext(filename)[0]
        
        # Pattern ottimizzato: solo minuscole, numeri e trattini
        pattern = self.config['images']['filenames']['pattern']
        
        # Verifica pattern base
        if not re.match(pattern, filename):
            return False
        
        # Verifica che non sia un nome generico o auto-generato
        generic_patterns = [
            r'img\d+',
            r'image\d+',
            r'photo\d+',
            r'picture\d+',
            r'screenshot\d+',
            r'[a-f0-9]{8,}',  # Hash-like
            r'untitled',
            r'dsc\d+',  # Camera default
        ]
        
        for generic in generic_patterns:
            if re.search(generic, name.lower()):
                return False
        
        # Verifica presenza di almeno 2 parole separate da trattini
        words = name.split('-')
        if len(words) < 2:
            return False
        
        return True
    
    def _check_image_size(self, url: str) -> float:
        """Scarica e verifica dimensione immagine in KB"""
        try:
            response = requests.get(url, timeout=10, stream=True)
            response.raise_for_status()
            
            # Ottieni dimensione dal Content-Length header
            if 'Content-Length' in response.headers:
                size_bytes = int(response.headers['Content-Length'])
                return size_bytes / 1024
            
            # Altrimenti scarica il contenuto
            content = response.content
            return len(content) / 1024
        except Exception:
            return None
    
    def _calculate_score(self, results: Dict) -> int:
        """Calcola score totale per le immagini"""
        if results['total_images'] == 0:
            return 100  # Nessuna immagine = nessun problema
        
        total = results['total_images']
        summary = results['summary']
        
        # Punteggio basato su vari fattori
        scores = []
        
        # Alt text (peso 40%)
        alt_score = ((total - summary['missing_alt']) / total) * 100
        scores.append(alt_score * 0.4)
        
        # Filename ottimizzati (peso 15%)
        filename_score = (summary['optimized_names'] / total) * 100
        scores.append(filename_score * 0.15)
        
        # Lazy loading (peso 20%)
        lazy_score = (summary['lazy_loaded'] / total) * 100
        scores.append(lazy_score * 0.2)
        
        # Formato moderno (peso 15%)
        format_score = (summary['modern_format'] / total) * 100
        scores.append(format_score * 0.15)
        
        # Dimensioni ottimizzate (peso 10%)
        if summary['oversized'] > 0:
            size_score = ((total - summary['oversized']) / total) * 100
        else:
            size_score = 100
        scores.append(size_score * 0.1)
        
        total_score = sum(scores)
        return round(total_score)

