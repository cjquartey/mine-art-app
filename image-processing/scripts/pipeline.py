#!/usr/bin/env python3
"""
End-to-End Image Processing Pipeline of photo to line art PNG to editable SVG.
Uses generate_lineart.py and vectorize_lineart.py with shared utilities.
"""

import os
import json
from pathlib import Path
import cv2

from preprocess import preprocess_image, smart_resize
from image_analyser import analyse_image
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
    
    def process(self, input_image, output_svg, style='contour', skip_preprocess=False):
        """
        Process photo through full pipeline.
        
        Args:
            input_image: Path to input image
            output_svg: Path to save final SVG
            style: 'contour' or 'anime'
            skip_preprocess: If True, skip preprocessing step
            
        Returns:
            dictionary with combined data:
                success (bool): Whether entire pipeline succeeded
                final_svg (str): Path to output SVG
                intermediate (dict): Paths to intermediate files
                metrics (dict): Combined timing and size info
                error (str): Error message if failed
                analysis (dict): Image analysis results
                preprocessing_applied (list): List of preprocessing steps applied
                warnings (list): Any warnings from analysis
        """
        # Create required folders
        temp_dir, outputs_dir = create_required_folders()
        
        # Generate temp filename for line art
        temp_lineart_name = generate_temp_filename(prefix='lineart', extension='.png')
        temp_lineart_path = os.path.join(temp_dir, temp_lineart_name)

        # Generate temp filenames for preprocessed image if needed
        temp_preprocessed_name = generate_temp_filename(prefix='preprocessed', extension='.jpg')
        temp_preprocessed_path = os.path.join(temp_dir, temp_preprocessed_name) 

        # setup list and results
        analysis_results = None
        preprocessing_applied = [] 
        
        try:
            # 1: Analyse image quality
            if not skip_preprocess: # if not skipping preprocess, run analysis to determine if preprocessing is needed
                analysis_results = analyse_image(input_image)
            
            # 2. Preprocess if needed based on analysis
            image_for_model = input_image
            if not skip_preprocess and analysis_results:
                # Load original image
                original_image = cv2.imread(input_image)

                if style == 'anime':
                    # Anime: resize only — gamma/CLAHE amplify the already heavy line preservation
                    preprocessed_image = smart_resize(original_image, target_min=512, target_max=2048)
                else:
                    # Contour: full preprocessing (resize + gamma + CLAHE)
                    preprocessed_image = preprocess_image(original_image, analysis_results)

                # Save preprocessed image to temp file for use in model
                cv2.imwrite(temp_preprocessed_path, preprocessed_image)
                image_for_model = temp_preprocessed_path # update path to use preprocessed image for model

                # Check what was applied
                height = analysis_results['resolution']['height']
                width = analysis_results['resolution']['width']
                smaller_side = min(height, width)
                larger_side = max(height, width)
                if smaller_side < 512 or larger_side > 2048:
                    preprocessing_applied.append('resize')

                if style != 'anime':
                    luminance = analysis_results.get('luminance', {})
                    contrast = analysis_results.get('contrast', {})

                    global_mean_brightness = luminance.get('global_mean', 127)
                    if global_mean_brightness < 80 or global_mean_brightness > 180:
                        preprocessing_applied.append('gamma_correction')

                    if contrast.get('low_contrast_flag') or luminance.get('warning_flag'):
                        preprocessing_applied.append('clahe')

            # 3. Generate line art
            lineart_result = self.lineart_generator.generate(
                input_path=image_for_model,
                output_path=temp_lineart_path,
                style=style
            )
            
            # If line art generation failed
            if not lineart_result['success']:
                cleanup_temp_files(temp_preprocessed_path, temp_lineart_path) # cleanup
                return self._create_failed_result(lineart_result, step='lineart') # return error immediately without trying to run vectorization
            
            # 4. Vectorize line art
            vectorization_result = self.vectorizer.vectorize(
                input_path=temp_lineart_path,
                output_path=output_svg,
                style=style
            )
            
            # Combine results
            combined_result = combine_results(lineart_result, vectorization_result)

            # add analysis and preprocessing info to combined result
            combined_result['analysis'] = analysis_results
            combined_result['preprocessing_applied'] = preprocessing_applied

            if analysis_results:
                combined_result['warnings'] = analysis_results.get('warnings', [])
            else:
                combined_result['warnings'] = []

            # update intermediate paths in combined result
            combined_result['intermediate']['preprocessed_image'] = temp_preprocessed_path if not skip_preprocess else None
            
            # Cleanup temp files
            cleanup_temp_files(temp_preprocessed_path, temp_lineart_path)
            
            return combined_result
            
        except Exception as e:
            # Cleanup on error
            cleanup_temp_files(temp_preprocessed_path, temp_lineart_path)
            
            return {
                'success': False,
                'final_svg': None,
                'intermediate': {'preprocessed_image': None, 'lineart_png': None},
                'analysis': analysis_results,
                'preprocessing_applied': preprocessing_applied,
                'warnings': analysis_results.get('warnings', []) if analysis_results else [],
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
    parser.add_argument(
        '--skip-preprocess',
        action='store_true',
        help='Skip image analysis and preprocessing'
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline = ImageProcessingPipeline(models_dir=args.models_dir)
    result = pipeline.process(args.input, args.output, style=args.style, skip_preprocess=args.skip_preprocess)
    
    # Print result
    print(json.dumps(result, indent=2))
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    exit(main())