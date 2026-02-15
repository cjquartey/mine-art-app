# Image Processing Pipeline

Line art generation and vectorization for mine-art-app capstone project.

## Overview

Two-step pipeline:
1. **Generate line art** from photos using pre-trained deep learning models
2. **Vectorize to SVG** for web-based editing with Paper.js

## Structure

```
image-processing/
├── models/              # Model weights (gitignored)
│   ├── contour_style/
│   │   └── netG_A_latest.pth
│   ├── anime_style/
│   │   └── netG_A_latest.pth
│   └── feats2Geom/
│       └── feats2depth.pth
├── scripts/             # Python pipeline scripts
│   ├── pipeline.py              # End-to-end pipeline
│   ├── pipeline_utils.py        # Helper functions
│   ├── generate_lineart.py      # Step 1: Photo to line art
│   ├── vectorize_lineart.py     # Step 2: Line art to SVG
│   ├── model.py                 # Generator architecture
│   └── requirements.txt
├── outputs/             # Generated line art and SVG files
├── temp/                # Temporary processing files (auto-created and cleaned up)
└── test_images/         # Test photos
```

## Setup

### 1. Install Python dependencies

```bash
cd image-processing
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Install Potrace (for vectorization)

**Mac:**
```bash
brew install potrace
```

### 3. Download model weights

The pre-trained `.pth` files are in:
- `models/contour_style/netG_A_latest.pth`
- `models/anime_style/netG_A_latest.pth`
- `models/feats2Geom/feats2depth.pth`

## Usage

Single command to go from a photo to svg

```
cd scripts

# Contour style
python pipeline.py photo.jpg ../outputs/drawing.svg --style contour

# Anime style
python pipeline.py photo.jpg ../outputs/drawing.svg --style anime
```

Output: Final SVG ready for our web editor

What it does:

- Generates line art PNG (saved to temp/)
- Vectorizes to SVG (saved to outputs/)
- Auto-cleans temp files
- Returns combined metadata


Optionally, you can also run individual steps separately

**Step 1: Generate Line Art**
```
python generate_lineart.py input.jpg ../outputs/lineart.png --style contour
```
**Step 2: Vectorise to SVG**
```
python vectorize_lineart.py ../outputs/lineart.png ../outputs/drawing.svg --style contour
```

## Output Formats

### Line Art (PNG)
- 256x256 resolution
- Grayscale single-channel
- Black lines on white background

### SVG (Vector)
- Scalable vector paths
- Editable Bezier curves
- Control points for manipulation
- Ready for Paper.js editor

## Technical Details

### Line Art Generation
- Based on "Learning to Generate Line Drawings" (Chan et al., 2022)
- Uses CycleGAN-style generator architecture
- Pre-trained on COCO dataset
- Inference time: 1-3 seconds per image

### Vectorization
- Uses Potrace for raster-to-vector conversion
- Style-specific threshold preprocessing
- Binary conversion with numpy
- Potrace CLI with optimized parameters
