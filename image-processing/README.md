# Image Processing Pipeline

Line art generation and vectorization for mine-art-app capstone project.

## Overview

Pipeline:
1. **Analyse** image quality (brightness, contrast, blur, resolution)
2. **Preprocess** conditionally based on analysis (contour style only)
3. **Generate line art** from photos using pre-trained deep learning models
4. **Vectorize to SVG** for web-based editing with Paper.js

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
│   ├── image_analyser.py        # Image quality analysis
│   ├── preprocess.py            # Conditional image preprocessing
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

Single command to go from a photo to SVG:

```
cd scripts

# Contour style (full preprocessing)
python pipeline.py photo.jpg ../outputs/drawing.svg --style contour

# Anime style (resize only, gamma/CLAHE skipped)
python pipeline.py photo.jpg ../outputs/drawing.svg --style anime

# Skip preprocessing manually
python pipeline.py photo.jpg ../outputs/drawing.svg --style contour --skip-preprocess
```

Output: Final SVG ready for our web editor

What it does:

- Analyses image quality (brightness, contrast, blur, resolution)
- Preprocesses if needed (contour style only)
- Generates line art PNG (saved to temp/)
- Vectorizes to SVG (saved to outputs/)
- Auto-cleans temp files
- Returns combined metadata with analysis + preprocessing info

Optionally, run individual steps separately:

**Analyse image quality**
```
python image_analyser.py photo.jpg
```

**Preprocess image**
```
python preprocess.py photo.jpg preprocessed.jpg

# Force specific corrections
python preprocess.py photo.jpg preprocessed.jpg --force-gamma 0.7
python preprocess.py photo.jpg preprocessed.jpg --force-clahe
python preprocess.py photo.jpg preprocessed.jpg --force-rescale
```

**Generate Line Art**
```
python generate_lineart.py input.jpg ../outputs/lineart.png --style contour
```

**Vectorise to SVG**
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

## Preprocessing

Preprocessing is style-aware. Resizing applies to both styles, but gamma correction and CLAHE are **contour only** — the anime model already preserves too many lines, and these corrections amplify that, producing noisy results.

| Step | Contour | Anime |
|------|---------|-------|
| Smart resize | yes | yes |
| Gamma correction | yes | skipped |
| CLAHE | yes | skipped |

What each step does:

- **Smart resize** — upscales small images (< 512px) and downscales large ones (> 2048px), preserving aspect ratio
- **Gamma correction** — brightens dark images or tones down overexposed ones when brightness is clearly off (mean < 80 or > 180)
- **CLAHE** — improves local contrast when the analyser flags low contrast or uneven lighting. Works in LAB colour space so only lightness is touched

The analyser checks four things: luminance (grid-based uneven lighting detection), blur (FFT + local Laplacian), contrast (std dev), and resolution. Warnings are surfaced in the pipeline output.

## Technical Details

### Line Art Generation
- Based on "Learning to Generate Line Drawings" (Chan et al., 2022)
- Uses CycleGAN-style generator architecture
- Pre-trained on COCO dataset
- Inference time: 1-3 seconds per image

### Vectorization
- Uses Potrace for raster-to-vector conversion
- **Otsu's thresholding** for binarization — automatically picks the optimal threshold per image instead of a fixed value, which works really well for anime style in particular (joins broken lines and produces much cleaner paths)
- Potrace CLI with optimized parameters per style

## API

HTTP wrapper around the pipeline for the Node.js server.

### Start the server

```bash
cd scripts
python api.py
# Runs on http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

Logs are written to `logs/api.log` and the terminal.

### Endpoints

**GET /health**
Returns `{ status: "healthy" }`. Use to check the server is up.

---

**POST /analyse**
Analyse image quality without generating an SVG.

| Field | Type | Notes |
|-------|------|-------|
| `file` | JPEG or PNG | Max 10MB |

Response:
```json
{
  "success": true,
  "data": {},
  "analysis": {
    "metrics": {
      "brightness": 0.5,
      "contrast": 0.46,
      "blur_score": 0.28,
      "resolution": [640, 427]
    },
    "warnings": ["Resolution is low (640x427)"]
  }
}
```

---

**POST /generate-svg**
Full pipeline — photo in, SVG out.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `file` | JPEG or PNG | — | Max 10MB |
| `style` | `contour` \| `anime` | `contour` | Dropdown in /docs |
| `skip_preprocess` | boolean | `false` | Skip analysis + preprocessing |

Response:
```json
{
  "success": true,
  "data": {
    "svg": "<svg>...</svg>",
    "style": "anime",
    "preprocessing_applied": ["resize"]
  },
  "analysis": {
    "metrics": {
      "total_time_ms": 2753,
      "lineart_time_ms": 1553,
      "vectorization_time_ms": 1200,
      "path_count": 82,
      "file_size_kb": 31.47
    },
    "warnings": ["Resolution is low (640x427)"]
  }
}
```

`total_time_ms` covers preprocessing + lineart + vectorization. Warnings reflect the original image before preprocessing was applied.
