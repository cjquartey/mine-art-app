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
│   ├── generate_lineart.py
│   ├── vectorize_lineart.py
│   ├── model.py
│   └── requirements.txt
├── outputs/             # Generated line art and SVG files
└── temp/                # Temporary processing files
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

### 1: Generate Line Art

Convert photo to line art PNG:

```bash
cd scripts

# Contour style
python generate_lineart.py input.jpg ../outputs/lineart.png --style contour

# Anime style
python generate_lineart.py input.jpg ../outputs/lineart.png --style anime
```

**Output:** PNG line art image

### 2: Vectorize to SVG

Convert line art PNG to editable SVG:

```bash
# Vectorize contour style
python vectorize_lineart.py ../outputs/lineart.png ../outputs/drawing.svg --style contour

# Vectorize anime style
python vectorize_lineart.py ../outputs/lineart.png ../outputs/drawing.svg --style anime
```

**Output:** SVG with editable paths

### Full Pipeline Example

```bash
# Complete workflow
python generate_lineart.py photo.jpg ../outputs/horse_lineart.png --style contour
python vectorize_lineart.py ../outputs/horse_lineart.png ../outputs/horse.svg --style contour

# Result: horse.svg ready for web editor
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
