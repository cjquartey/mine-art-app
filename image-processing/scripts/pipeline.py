#!/usr/bin/env python3
"""
End-to-End Image Processing Pipeline of photo to line art PNG to editable SVG.
Uses generate_lineart.py and vectorize_lineart.py with shared utilities.
"""

import os
import json
from pathlib import Path

from generate_lineart import LineArtGenerator
from vectorize_lineart import LineArtVectorizer
from pipeline_utils import (
    create_required_folders,
    generate_temp_filename,
    cleanup_temp_files,
    combine_results
)

class ImageProcessingPipeline:
    """Class for running the full photo to SVG pipeline."""
    
    def __init__(self, models_dir='../models'):
        """
        Initialize pipeline with both generators.
        
        Args:
            models_dir: Path to model weights directory
        """
        self.lineart_generator = LineArtGenerator(models_dir=models_dir)
        self.vectorizer = LineArtVectorizer()
    
    def process(self, input_photo, output_svg, style='contour'):
        """
        Process photo through full pipeline.
        
        Args:
            input_photo: Path to input photo
            output_svg: Path to save final SVG
            style: 'contour' or 'anime'
            
        Returns:
            dictionary with combined data:
                success (bool): Whether entire pipeline succeeded
                final_svg (str): Path to output SVG
                intermediate (dict): Paths to intermediate files
                metrics (dict): Combined timing and size info
                error (str): Error message if failed
        """
        # Create required folders
        temp_dir, outputs_dir = create_required_folders()
        
        # Generate temp filename for line art
        temp_lineart_name = generate_temp_filename(prefix='lineart', extension='.png')
        temp_lineart_path = os.path.join(temp_dir, temp_lineart_name)
        
        try:
            # Generate line art
            lineart_result = self.lineart_generator.generate(
                input_path=input_photo,
                output_path=temp_lineart_path,
                style=style
            )
            
            # If line art generation failed
            if not lineart_result['success']:
                cleanup_temp_files(temp_lineart_path) # cleanup
                return self._create_failed_result(lineart_result, step='lineart') # return error immediately without trying to run vectorization
            
            # Vectorize line art
            vectorization_result = self.vectorizer.vectorize(
                input_path=temp_lineart_path,
                output_path=output_svg,
                style=style
            )
            
            # Combine results
            combined_result = combine_results(lineart_result, vectorization_result)
            
            # Cleanup temp files
            cleanup_temp_files(temp_lineart_path)
            
            return combined_result
            
        except Exception as e:
            # Cleanup on error
            cleanup_temp_files(temp_lineart_path)
            
            return {
                'success': False,
                'final_svg': None,
                'intermediate': {'lineart_png': None},
                'metrics': {
                    'total_time': 0.0,
                    'lineart_time': 0.0,
                    'vectorization_time': 0.0,
                    'path_count': None,
                    'file_size_kb': None
                },
                'error': f"Pipeline error: {str(e)}"
            }
    
    def _create_failed_result(self, failed_result, step):
        """
        Create result dict for failed pipeline step.
        
        Args:
            failed_result: Result dict from failed step
            step: 'lineart' or 'vectorization'
            
        Returns:
            Formatted error result dict
        """
        return {
            'success': False,
            'final_svg': None,
            'intermediate': {'lineart_png': None},
            'metrics': {
                'total_time': failed_result['processing_time'],
                'lineart_time': failed_result['processing_time'] if step == 'lineart' else 0.0,
                'vectorization_time': failed_result['processing_time'] if step == 'vectorization' else 0.0,
                'path_count': None,
                'file_size_kb': None
            },
            'error': f"{step.capitalize()} failed: {failed_result['error']}"
        }


def main():
    """Command-line interface."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='End-to-end pipeline: Photo to editable SVG'
    )
    parser.add_argument(
        'input',
        help='Path to input photo'
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
    parser.add_argument(
        '--models-dir',
        default='../models',
        help='Path to models directory'
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline = ImageProcessingPipeline(models_dir=args.models_dir)
    result = pipeline.process(args.input, args.output, style=args.style)
    
    # Print result
    print(json.dumps(result, indent=2))
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    exit(main())