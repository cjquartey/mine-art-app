#!/usr/bin/env python3
"""
Conditionally enhances images based on analyzer results.
Applied BEFORE line art generation model.
"""

import cv2
import numpy as np


def calculate_gamma(mean_brightness):
    """
    Decide how strong gamma correction should be  based on the image's average brightness.
    
    Uses formula: gamma = 1.0 + ((127 - mean) / 255) * 0.5
        Dark images (mean < 127): gamma < 1.0 (brighten)
        Bright images (mean > 127): gamma > 1.0 (darken)
        Normal images (mean ≈ 127): gamma ≈ 1.0 (no change)
    
    Args:
        mean_brightness: Average brightness (0-255)
        
    Returns:
        Gamma value (clamped between 0.5 and 1.5)
    """
    # Smooth curve formula
    gamma = 1.0 # Base gamma value
    gamma += ((127 - mean_brightness) / 255) * 0.5
    
    # Clamp gamma to reasonable range to avoid over-correction
    if gamma < 0.5: # Prevent excessive brightening of very dark images
        gamma = 0.5
    if gamma > 1.5: # Prevent excessive darkening of very bright images
        gamma = 1.5
    
    return gamma


def apply_gamma_correction(image, gamma=1.0):
    """
    Apply gamma correction to adjust brightness.
    
    Gamma < 1.0: brighten dark images
    Gamma > 1.0: darken bright images
    
    Args:
        image: Input image (color or grayscale)
        gamma: Gamma value (default 1.0 = no change)
        
    Returns:
        Gamma-corrected image
    """
    inverse_gamma = 1.0 / gamma # Invert gamma for correct mapping

    # Build lookup table (0 to 255))
    table = []
    for i in range(256):
        value = (i / 255.0) ** inverse_gamma
        table.append(int(value * 255))

    lookup_table = np.array(table).astype("uint8")
    
    # Apply lookup table to the image
    corrected_image = cv2.LUT(image, lookup_table) # LUT (Look-Up Table) for fast pixel-wise transformation
    
    return corrected_image


def apply_clahe(image, clip_limit=2.0, tile_grid_size=(8, 8)):
    """
    Improve local contrast using CLAHE.
    Only the brightness channel is modified.
    
    Args:
        image: Input image (BGR color)
        clip_limit: Contrast limiting threshold (default 2.0)
        tile_grid_size: Size of grid for local enhancement
        
    Returns:
        CLAHE-enhanced image
    """
    # Convert BGR to LAB color space (L = lightness, A/B = color channels)
    lab_image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    
    # Split into the 3 channels
    l_channel, a_channel, b_channel = cv2.split(lab_image)
    
    # Apply CLAHE to L channel only to correct brightness/contrast without affecting colors
    clahe = cv2.createCLAHE(
        clipLimit=clip_limit, 
        tileGridSize=tile_grid_size)
    l_channel_clahe = clahe.apply(l_channel)
    
    # Merge channels back together
    lab_clahe = cv2.merge([l_channel_clahe, a_channel, b_channel])
    
    # Convert back to BGR
    enhanced_image = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)
    
    return enhanced_image


def smart_resize(image, target_min=512, target_max=2048):
    """
    Resize images while keeping the aspect ratio
    
        Upscales if too small (< target_min)
        Downscales if too large (> target_max)
        Preserves aspect ratio
    
    Args:
        image: Input image
        target_min: Minimum dimension target (default 512)
        target_max: Maximum dimension target (default 2048)
        
    Returns:
        Resized image (or original if already in range)
    """
    height, width = image.shape[:2] # get dimensions

    smallest_side = min(height, width)
    largest_side = max(height, width)
    
    # Check if resizing is needed
    if smallest_side >= target_min and largest_side <= target_max:
        # Already in optimal range
        return image
    
    # Determine scale factor
    if smallest_side < target_min:
        # Too small (upscale based on minimum dimension)
        scale = target_min / smallest_side
    else:
        # Too large (downscale based on maximum dimension)
        scale = target_max / largest_side
    
    # Calculate new dimensions
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    # Choose interpolation method
    # interpolation is used to figure out what color each pixel in the resized image should be based on the original pixels
    if scale > 1.0:
        # Upscaling use Lanczos (best quality)
        interpolation = cv2.INTER_LANCZOS4 # lanzos samples a larger area of pixels to determine the color of each new pixel
    else:
        # Downscaling use area interpolation 
        interpolation = cv2.INTER_AREA # prevents jagged edges by averaging pixel values when reducing size
    
    # Resize
    resized = cv2.resize(image, (new_width, new_height), interpolation=interpolation)
    
    return resized


def preprocess_image(image, analysis_results):
    """
    Conditionally preprocess photo based on analyzer results.

    Processing order:
    1. Resize (if needed)
    2. Gamma correction (if extreme brightness)
    3. CLAHE (if low contrast OR uneven lighting)

    Args:
        image: Input image (BGR color, from cv2.imread)
        analysis_results: Dict from image_analyzer.analyze_image()

    Returns:
        Preprocessed image ready for line art model
    """
    processed = image.copy()

    # Extract analysis metrics
    luminance = analysis_results.get('luminance', {})
    contrast = analysis_results.get('contrast', {})
    resolution = analysis_results.get('resolution', {})

    # 1. Resize
    # Check if image is too small or too large
    height, width = processed.shape[:2]
    smallest_side = min(height, width)
    largest_side = max(height, width)
    if smallest_side < 512 or largest_side > 2048:
        processed = smart_resize(processed, target_min=512, target_max=2048)

    # 2. Gamma correction
    global_mean_brightness = luminance.get('global_mean', 127) # get global mean brightness, default to 127 if not available (neutral)

    # Only apply gamma if brightness is clearly off
    if global_mean_brightness < 80 or global_mean_brightness > 180:
        gamma = calculate_gamma(global_mean_brightness)
        processed = apply_gamma_correction(processed, gamma)

    # 3. CLAHE
    low_contrast = contrast.get('low_contrast_flag', False) # get low contrast flag, default to False if not available
    uneven_lighting = luminance.get('warning_flag', False) # get uneven lighting flag

    if low_contrast or uneven_lighting:
        processed = apply_clahe(processed, clip_limit=2.0)

    return processed


def main():
    """Command-line interface for testing."""
    import argparse
    from image_analyser import analyze_image
    
    parser = argparse.ArgumentParser(
        description='Preprocess image based on quality analysis'
    )
    parser.add_argument(
        'input',
        help='Path to input image'
    )
    parser.add_argument(
        'output',
        help='Path to save preprocessed image'
    )
    parser.add_argument(
        '--force-gamma',
        type=float,
        help='Force gamma correction value (overrides auto)'
    )
    parser.add_argument(
        '--force-clahe',
        action='store_true',
        help='Force CLAHE enhancement'
    )
    parser.add_argument(
        '--force-rescale',
        action='store_true',
        help='Force rescaling to 512px minimum'
    )
    
    args = parser.parse_args()
    
    # Load image
    image = cv2.imread(args.input)
    if image is None:
        print(f"Error: Could not load {args.input}")
        return 1
    
    # Analyze image
    print("Analyzing image...")
    analysis = analyze_image(args.input)
    
    # Show warnings
    if analysis['has_warnings']:
        print("\nWarnings detected:")
        for warning in analysis['warnings']:
            print(f"  - {warning}")
    
    # Preprocess
    print("\nPreprocessing the image...")
    
    # Start with original or auto-preprocessed
    if args.force_gamma or args.force_clahe or args.force_rescale:
        # Manual mode - start with original
        processed = image.copy()
        steps_applied = []
        
        # Apply forced steps in optimal order
        if args.force_rescale:
            processed = smart_resize(processed)
            steps_applied.append("  - Forced rescale")
        
        if args.force_gamma:
            processed = apply_gamma_correction(processed, args.force_gamma)
            steps_applied.append(f"  - Forced gamma ({args.force_gamma})")
        
        if args.force_clahe:
            processed = apply_clahe(processed)
            steps_applied.append("  - Forced CLAHE")
        
        print("Applied enhancements (manual):")
        for step in steps_applied:
            print(step)
    else:
        # Automatic based on analysis
        processed = preprocess_image(image, analysis)
        
        # Show what was applied
        print("Applied enhancements (automatic):")
        applied = []
        
        global_mean = analysis['luminance']['global_mean']
        if global_mean < 80 or global_mean > 180:
            gamma = calculate_gamma(global_mean)
            applied.append(f"  - Gamma correction ({gamma:.2f})")
        
        if analysis['contrast']['low_contrast_flag'] or analysis['luminance'].get('uneven_lighting', False):
            applied.append("  - CLAHE contrast enhancement")
        
        height = analysis['resolution']['height']
        width = analysis['resolution']['width']
        min_dim = min(height, width)
        max_dim = max(height, width)
        if min_dim < 512 or max_dim > 2048:
            applied.append("  - Smart resize")
        
        if applied:
            for item in applied:
                print(item)
        else:
            print("  - None (image quality is acceptable)")
    
    # Save
    cv2.imwrite(args.output, processed)
    print(f"\nSaved preprocessed image to: {args.output}")
    
    return 0


if __name__ == '__main__':
    exit(main())