#!/usr/bin/env python3
"""
Analyzes image quality and characteristics before preprocessing and vectorisation.
"""
import cv2
import numpy as np

# All thresholds live here so they are easy to tune
CONFIG = {
    'luminance': {
        'too_dark': 50,
        'too_bright': 200,
        'grid_size': 8,  # split image into 8x8 grid for local luminance analysis
        'cell_threshold': 0.25  # 25% difference from mean for dark/bright cell classification
    },
    'blur': {
        'standard_width': 512,          # width to resize to for universal blur thresholds
        'fft_threshold': 6.9,            # high-frequency energy below this = blurry
        'block_size': 64,               # block size for checking local blur with Laplacian variance
        'block_lap_threshold': 55,      # per-block laplacian variance below this = blurry block
        'block_blurry_ratio': 0.5,      # if >60% of blocks are blurry, flag the image
    },
    'contrast': {
        'threshold': 50 # standard deviation below this is considered low contrast
    },
    'resolution': {
        'min_dimension': 512 # images smaller than this in either dimension may produce poor results
    }
}


def load_image(image_path):
    """
    Load image once for all analysis functions and return both color and grayscale versions.
    
    Args:
        image_path: Path to image file
        
    Returns:
        tuple: (color_image, grayscale_image)
    """
    # Load color image
    color_image = cv2.imread(image_path)
    
    # Check if image loaded successfully
    if color_image is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Convert to grayscale
    gray_image = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    
    return color_image, gray_image


def check_luminance(gray_image):
    """
    Check image brightness and uneven lighting.
    
    Divides image into NxN grid and compares each cell's luminance
    to global mean to detect uneven lighting.
    
    Args:
        gray_image: Grayscale image array
        
    Returns:
            Diictionary with:
                global_mean: Overall average brightness (0-255)
                dark_cells: Number of cells significantly darker than mean
                bright_cells: Number of cells significantly brighter than mean
                warning_flag: True if too dark, too bright, or unevenly lit
                message: Warning message if applicable
    """
    # Calculate global mean
    global_mean = np.mean(gray_image)
    
    # Get grid size
    grid_size = CONFIG['luminance']['grid_size']
    
    # Get image dimensions
    height, width = gray_image.shape
    
    # Calculate cell dimensions
    cell_height = height // grid_size # floor division to get integer cell size
    cell_width = width // grid_size
    
    # Analyze each grid cell
    dark_cells = 0 # counters
    bright_cells = 0
    
    for row in range(grid_size): # loop through grid rows
        for col in range(grid_size): # loop through grid columns for each row
            # Extract cell
            y_start = row * cell_height
            y_end = (row + 1) * cell_height if row < grid_size - 1 else height # ensure last cell includes any remainder pixels
            x_start = col * cell_width
            x_end = (col + 1) * cell_width if col < grid_size - 1 else width # ensure last cell includes any remainder pixels
            
            cell = gray_image[y_start:y_end, x_start:x_end]
            
            # Calculate cell mean
            cell_mean = np.mean(cell)

            # Compare to global mean using relative threshold
            threshold_percent = CONFIG['luminance']['cell_threshold'] # get threshold percentage from config
            dark_threshold = global_mean * (1 - threshold_percent)
            bright_threshold = global_mean * (1 + threshold_percent)

            # Classify cell as dark, or bright
            if cell_mean < dark_threshold:
                dark_cells += 1
            elif cell_mean > bright_threshold:
                bright_cells += 1
    
    # Check thresholds
    too_dark = global_mean < CONFIG['luminance']['too_dark'] # global mean below this is too dark
    too_bright = global_mean > CONFIG['luminance']['too_bright'] # global mean above this is too bright
    uneven_lighting = dark_cells > (grid_size * grid_size) * 0.2 or bright_cells > (grid_size * grid_size) * 0.2 # more than 20% of cells are dark or bright indicates uneven lighting
    
    warning_flag = too_dark or too_bright or uneven_lighting
    
    # Dictate message based on which condition is met
    message = None
    if too_dark:
        message = "Image is very dark (may result in incomplete line art)"
    elif too_bright:
        message = "Image is very bright (may result in weak lines)"
    elif uneven_lighting:
        message = "Image has uneven lighting (some areas may be over/under exposed)"
    
    return {
        'global_mean': round(float(global_mean), 2),
        'dark_cells': int(dark_cells),
        'bright_cells': int(bright_cells),
        'warning_flag': bool(warning_flag),
        'message': message
    }


def detect_blur(gray_image):
    """
    Detect blur using FFT frequency analysis + local block-based Laplacian.

    1. Normalise by resizing to fixed width so thresholds are universal
    2. Light Gaussian blur to kill noise without affecting real edges
    3. FFT (Fast Fourier transform): measures high-frequency energy loss (catches motion, bokeh, defocus)
    4. Local blocks: catches regional blur even when some areas have sharp edges

    Flags as blurry if EITHER method detects blur.

    Args:
        gray_image: Grayscale image array

    Returns:
        Dictionary with blur analysis results
    """
    cfg = CONFIG['blur']

    # Normalising by resizing to fixed width
    h, w = gray_image.shape
    standard_w = cfg['standard_width']
    scale = standard_w / w
    standardized = cv2.resize(gray_image, (standard_w, int(h * scale)))

    # Light Gaussian to kill noise that tricks edge detectors into thinking image is sharper than it is
    smoothed = cv2.GaussianBlur(standardized, (3, 3), 0)

    sh, sw = smoothed.shape

    # FFT: high-frequency energy ratio
    # Blurry images lack high-frequency content regardless of blur type
    img_f = smoothed.astype(np.float32) / 255.0 # normalise to 0-1 for more consistent thresholds across images
    f_shift = np.fft.fftshift(np.fft.fft2(img_f)) # shift zero frequency to center for easier analysis
    magnitude = 20 * np.log(np.abs(f_shift) + 1) # log scale to compress range and avoid dominance of very high values (add 1 to avoid log(0))

    # Sample corners of spectrum (high-freq regions)
    patch_size = min(64, sh // 8, sw // 8)
    corners = [
        magnitude[:patch_size, :patch_size],
        magnitude[:patch_size, -patch_size:],
        magnitude[-patch_size:, :patch_size],
        magnitude[-patch_size:, -patch_size:]
    ]
    hf_energy = np.mean([c.mean() for c in corners])
    fft_blurry = hf_energy < cfg['fft_threshold']

    # Local block Laplacian
    # Slide blocks across image, flag if too many blocks are blurry
    block_size = cfg['block_size']
    blurry_blocks = 0
    total_blocks = 0

    for y in range(0, sh - block_size, block_size // 2):
        for x in range(0, sw - block_size, block_size // 2):
            block = smoothed[y:y + block_size, x:x + block_size]
            lap_var = cv2.Laplacian(block, cv2.CV_64F).var()
            total_blocks += 1
            if lap_var < cfg['block_lap_threshold']:
                blurry_blocks += 1

    blur_ratio = blurry_blocks / total_blocks if total_blocks > 0 else 0
    local_blurry = blur_ratio > cfg['block_blurry_ratio']

    # Flag as blurry only if both methods agree (avoids false positives)
    is_blurry = fft_blurry and local_blurry

    # Message
    if is_blurry:
        message = "Image is blurry"
    elif fft_blurry or local_blurry:
        message = "Image has minor blur (borderline)"
    else:
        message = "Image sharpness is acceptable"

    return {
        'fft_high_freq': round(float(hf_energy), 2),
        'blur_ratio': round(float(blur_ratio), 3),
        'is_blurry': bool(is_blurry),
        'message': message
    }


def check_resolution(color_image):
    """
    Check if image resolution is adequate.
    
    Args:
        color_image: Color image array
        
    Returns:
        Dictionary with:
            width: Image width in pixels
            height: Image height in pixels
            warning_flag: True if resolution is too low
            message: Warning message if applicable
    """
    # Get dimensions
    height, width = color_image.shape[:2]
    
    # Check minimum
    min_dimension = CONFIG['resolution']['min_dimension']
    too_small = width < min_dimension or height < min_dimension # if either dimension is below minimum, flag as too small
    
    # Dictate message based on which condition is met
    message = None
    if too_small:
        message = f"Resolution is low ({width}x{height}), recommend at least {min_dimension}x{min_dimension}"
    
    return {
        'width': width,
        'height': height,
        'warning_flag': bool(too_small),
        'message': message
    }


def check_contrast(gray_image):
    """
    Check image contrast level.
    
    Args:
        gray_image: Grayscale image array
        
    Returns:
        Dictionary with:
            std_dev: Standard deviation of pixel values
            low_contrast_flag: True if contrast is low
            message: Description of contrast level
    """
    # Calculate standard deviation
    std_dev = np.std(gray_image)
    
    # Check threshold
    threshold = CONFIG['contrast']['threshold']
    low_contrast = std_dev < threshold
    
    # Dictate message based on which condition is met
    if std_dev < 30:
        message = "Very low contrast - enhancement recommended"
    elif std_dev < threshold:
        message = "Low contrast - may benefit from enhancement"
    else:
        message = "Contrast is acceptable"
    
    return {
        'std_dev': round(float(std_dev), 2),
        'low_contrast_flag': bool(low_contrast),
        'message': message
    }


def analyse_image(image_path):
    """
    Run all analysis functions on an image.
    
    Args:
        image_path: Path to image file
        
    Returns:
        Dictionary with all analysis results
    """
    # Load image once
    color_image, gray_image = load_image(image_path)
    
    # Run all checks
    luminance = check_luminance(gray_image)
    blur = detect_blur(gray_image)
    resolution = check_resolution(color_image)
    contrast = check_contrast(gray_image)
    
    # Build results
    results = {
        'luminance': luminance,
        'blur': blur,
        'resolution': resolution,
        'contrast': contrast
    }
    
    # Collect warnings
    warnings = []
    if luminance['warning_flag']:
        warnings.append(luminance['message'])
    if blur['is_blurry']:
        warnings.append(blur['message'])
    if resolution['warning_flag']:
        warnings.append(resolution['message'])
    if contrast['low_contrast_flag']:
        warnings.append(contrast['message'])
    
    results['warnings'] = warnings
    results['has_warnings'] = len(warnings) > 0
    
    return results


def main():
    """Command-line interface for testing."""
    import argparse
    import json
    
    parser = argparse.ArgumentParser(
        description='Analyze image quality and characteristics'
    )
    parser.add_argument(
        'image',
        help='Path to image file'
    )
    
    args = parser.parse_args()
    
    # Analyze
    results = analyse_image(args.image)
    
    # Print results
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()