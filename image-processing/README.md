# Image Processing Pipeline

Line art generation and vectorization for mine-art-app.

Models are stored locally (gitignored) for now

## Structure
```
image-processing/
├── models/  # Model weights (gitignored) - the .pth files for contour, anime and the feats2depth helper network
├── scripts/ # Python scripts
├── output/  # Generated outputs
└── temp/    # Temporary files
```

## Setup

1. **Install Python dependencies:**
```bash
   cd image-processing
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
```