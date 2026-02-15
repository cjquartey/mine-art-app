#!/usr/bin/env python3
"""
Pipeline Utilities
Helper functions for end-to-end image processing pipeline.
"""

import os
import uuid
from pathlib import Path


def create_required_folders(base_dir='..'):
    """
    Create temp and outputs folders if they don't exist.
    
    Args:
        base_dir: Base directory (default: parent of scripts/)
    """
    temp_dir = Path(base_dir) / 'temp'
    outputs_dir = Path(base_dir) / 'outputs'
    
    temp_dir.mkdir(exist_ok=True)
    outputs_dir.mkdir(exist_ok=True)
    
    return str(temp_dir), str(outputs_dir)


def generate_temp_filename(prefix='temp', extension='.png'):
    """
    Generate unique temporary filename.
    
    Args:
        prefix: Filename prefix
        extension: File extension
        
    Returns:
        Unique filename string
    """
    unique_id = uuid.uuid4().hex[:8] # Short unique ID using first 8 chars of UUID4
    # UUID4 generates a 128-bit random value, and using the first 8 hex chars gives us 32 bits of randomness (4 billion possibilities)
    return f"{prefix}_{unique_id}{extension}"


def cleanup_temp_files(*file_paths):
    """
    Delete temporary files.
    
    Args:
        *file_paths: Variable number of file paths to delete
    """
    # * tells Python to accept any number of positional arguments and pack them into a tuple called file_paths
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass


def combine_results(lineart_result, vectorization_result):
    """
    Combine results from both pipeline steps.
    
    Args:
        lineart_result: Result dictionary from generate_lineart
        vectorization_result: Result dictionary from vectorize_lineart
        
    Returns:
        Combined result dict
    """
    # success is true only if both steps succeeded
    success = lineart_result['success'] and vectorization_result['success']
    
    combined = {
        'success': success,
        'final_svg': vectorization_result['output_path'] if success else None, # only set if both steps succeeded
        'intermediate': {
            'lineart_png': lineart_result['output_path']
        },

        # Initialize metrics with defaults
        'metrics': {
            'total_time': 0.0,
            'lineart_time': lineart_result['processing_time'],
            'vectorization_time': 0.0,
            'path_count': None,
            'file_size_kb': None
        },
        'error': None
    }
    
    # If both steps succeeded, fill in vectorization metrics and total time
    if success:
        combined['metrics']['vectorization_time'] = vectorization_result['processing_time']

        # adding lineart and vectorization time to get total time
        combined['metrics']['total_time'] = (
            lineart_result['processing_time'] + 
            vectorization_result['processing_time']
        )
        
        combined['metrics']['path_count'] = vectorization_result['metrics']['path_count']
        combined['metrics']['file_size_kb'] = vectorization_result['metrics']['file_size_kb']

    # otherwise, set error message based on which step failed
    else:
        # because if lineart_result failed, vectorization_result likely won't have meaningful error info since it probably didn't run properly
        if not lineart_result['success']:
            combined['error'] = f"Line art generation failed: {lineart_result['error']}"
        else:
            combined['error'] = f"Vectorization failed: {vectorization_result['error']}"
    
    return combined