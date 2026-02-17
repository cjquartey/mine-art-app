#!/usr/bin/env python3
"""
Style-aware Potrace wrapper for converting line art PNG to editable SVG.
"""

import os
import time
import json
import subprocess
from pathlib import Path
import cv2

from PIL import Image
import numpy as np


class LineArtVectorizer:
    """Converts line art images to SVG with style-specific optimization."""
    
    def __init__(self):
        """Initialize vectorizer with style configurations."""
        
        # Style-specific parameters
        self.style_configs = {
            'contour': {
                # pixels darker than this become lines, lighter become background.
                'threshold': 128,
                
                # ignores any tiny specks smaller than 5 pixels.
                'turdsize': 5,
                
                # Corner sharpness: 1.0 is standard; lower makes it more "boxy," higher makes it smoother.
                'alphamax': 1.0,
                
                # how much the SVG can "stray" from the original pixels to stay smooth.
                'opttolerance': 0.2
            },
            'anime': {
                'threshold': 180, # Anime line art often has thinner lines
                'turdsize': 5,
                'alphamax': 1.3,
                'opttolerance': 0.4
            }
        }
    
    def vectorize(self, input_path, output_path, style='contour'):
        """
        Convert line art PNG to SVG.
        
        Args:
            input_path: Path to input line art PNG
            output_path: Path to save output SVG
            style: 'contour' or 'anime'
            
        Returns:
            A dictionary with metrics and status:
                success (bool): Whether vectorization succeeded
                output_path (str): Path to SVG file
                metrics (dict): path_count, file_size_kb
                processing_time (float): Time in seconds
                error (str): Error message if failed
        """

        start_time = time.time() # start timer for tracking processing time

        # initialize result dictionary with default values
        result = {
            'success': False,
            'output_path': None,
            'metrics': None,
            'processing_time': 0.0,
            'error': None
        }
        
        try:
            # Validate that style exists/is supported
            if style not in self.style_configs:
                raise ValueError(f"Invalid style '{style}'. Choose 'contour' or 'anime'.")
            
            # Check that the image input file exists
            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Input image not found: {input_path}")
            
            # Get style configuration
            config = self.style_configs[style]
            
            # Preprocess to binary image in order to run Potrace (which expects a binary bitmap)
            binary_path = self._preprocess_image(input_path, config['threshold'])
            
            # run portrace to get the svg path
            svg_path = self._run_potrace(binary_path, output_path, config) 
            
            # Calculate metrics from the generated svg file
            path_count = self._count_paths(svg_path)
            file_size = os.path.getsize(svg_path)
            
            # Cleanup temp file
            try:
                os.remove(binary_path)
            except:
                pass
            
            # Save results
            result['success'] = True
            result['output_path'] = svg_path
            result['metrics'] = {
                'path_count': path_count,
                'file_size_bytes': file_size,
                'file_size_kb': round(file_size / 1024, 2)
            }
            result['processing_time'] = time.time() - start_time
            
        except Exception as e:
            result['error'] = str(e)
            result['processing_time'] = time.time() - start_time
        
        return result
    
    def _preprocess_image(self, input_path, threshold):
        """
        Convert image to binary using Otsu's thresholding.

        Args:
            input_path: Path to input image
            threshold: Ignored (kept for API compatibility); Otsu computes optimal threshold automatically

        Returns:
            Path to binary PBM file
        """
        # Load image as grayscale
        image_array = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

        # Apply Otsu's thresholding (automatically determines optimal threshold for doing binary segmentation)
        _, binary = cv2.threshold(image_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Convert to PIL image
        binary_image = Image.fromarray(binary)
        
        # Save as PBM (Potrace's preferred format)
        temp_path = input_path + '_temp.pbm'
        binary_image.save(temp_path)
        
        return temp_path
    
    def _run_potrace(self, pbm_path, output_path, config):
        """
        Run Potrace command-line tool.
        
        Args:
            pbm_path: Path to binary PBM file
            output_path: Path to save SVG
            config: Style configuration dict
            
        Returns:
            Path to generated SVG
        """
        # Create output directory if needed
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Build Potrace command
        cmd = [
            'potrace',
            pbm_path,
            '-s',  # SVG output
            '-o', output_path,
            '--turdsize', str(config['turdsize']),
            '--alphamax', str(config['alphamax']),
            '--opttolerance', str(config['opttolerance'])
        ]
        
        # Run Potrace
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Potrace failed: {result.stderr}")
        
        return output_path
    
    def _count_paths(self, svg_path):
        """
        Count number of paths in SVG.
        
        Args:
            svg_path: Path to SVG file
            
        Returns:
            Number of path elements
        """
        with open(svg_path, 'r') as f:
            content = f.read()
        
        return content.count('<path') # count how many path start tags there are


def main():
    """Command-line interface for testing."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Vectorize line art PNG to SVG'
    )
    parser.add_argument(
        'input',
        help='Path to input line art PNG'
    )
    parser.add_argument(
        'output',
        help='Path to save output SVG'
    )
    parser.add_argument(
        '--style',
        choices=['contour', 'anime'],
        default='contour',
        help='Line art style (default: contour)'
    )
    
    args = parser.parse_args()
    
    # Vectorize
    vectorizer = LineArtVectorizer()
    result = vectorizer.vectorize(args.input, args.output, style=args.style)
    
    # Print result
    print(json.dumps(result, indent=2))
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    exit(main())