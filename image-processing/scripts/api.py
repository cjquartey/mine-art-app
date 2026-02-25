#!/usr/bin/env python3
"""
FastAPI Server
HTTP API wrapper for the image processing pipeline.
Allows Node.js server to call Python pipeline via HTTP requests.
"""

import os
import re
import time
import uuid
import logging
from enum import Enum
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from image_analyser import analyse_image
from pipeline import ImageProcessingPipeline

# Base directory and models directory definition
BASE_DIR = Path(__file__).parent
MODELS_DIR = os.getenv("MODELS_DIR", str(BASE_DIR / "../models"))

# Logging in order to track API usage and errors
LOG_FILE = BASE_DIR / "../logs/api.log" # setting up file path
LOG_FILE.parent.mkdir(parents=True, exist_ok=True) # ensure logs directory exists

logging.basicConfig(
    level=logging.INFO, # logging info is used to track normal operations, warnings for potential issues, and errors for exceptions
    format='%(asctime)s - %(levelname)s - %(message)s', # time, log level, and message format
    handlers=[
        logging.StreamHandler(),            # handler to log to the terminal
        logging.FileHandler(LOG_FILE)       # handler to log to the log file
    ]
)
logger = logging.getLogger(__name__) # initialises logger

# Initialize FastAPI app
app = FastAPI(
    title="Image to SVG API",
    description="Convert photos to editable SVG line art",
    version="1.0.0"
)

# Add CORS middleware
# CORS (Cross-Origin Resource Sharing) is necessary to allow the Node.js frontend to make requests to this FastAPI backend
app.add_middleware(
    CORSMiddleware,

    # TODO: In production, replace "*" with the actual URL of our Node.js server to restrict access
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = BASE_DIR / "../temp/uploads" # Temporary directory for uploaded files
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Initialising the image-processing pipeline
pipeline = ImageProcessingPipeline(models_dir=MODELS_DIR)

# File size limit (20MB)
MAX_FILE_SIZE = 20 * 1024 * 1024

# Style options for SVG generation - shown as a dropdown in the Swagger UI
class StyleOption(str, Enum):
    contour = "contour"
    anime = "anime"

# Valid image types (magic bytes)
# Looking at the first few bytes of image files
VALID_IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': 'image/jpeg',  # JPEG
    b'\x89PNG\r\n\x1a\n': 'image/png',  # PNG
}


def validate_image_file(file_bytes: bytes) -> bool:
    """
    Validate image file using magic byte checking.
    
    Args:
        file_bytes: First few bytes of file
        
    Returns:
        True if valid image format
    """
    for signature in VALID_IMAGE_SIGNATURES.keys():
        if file_bytes.startswith(signature):
            return True
    return False


def create_success_response(data: dict, analysis: dict = None):
    """
    Create success response for Node.js.
    
    Args:
        data: Main response data
        analysis: Optional analysis results
        
    Returns:
        Structured response dict
    """
    return {
        "success": True,
        "data": data, # this will have the svg content and metadata
        "analysis": analysis, # this will have the quality analysis results and warnings
        "error": None
    }


def create_error_response(message: str, code: str = "PROCESSING_ERROR"):
    """
    Create error response for Node.js.
    
    Args:
        message: Error message
        code: Error code for client handling
        
    Returns:
        Structured error dict
    """
    return {
        "success": False,
        "data": None,
        "analysis": None,
        "error": {
            "code": code,
            "message": message
        }
    }


@app.get("/")
def root():
    """Root endpoint for API information."""
    return {
        "message": "Image to SVG API",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyse": "Analyse image quality",
            "POST /generate-svg": "Full pipeline conversion of photo to SVG",
            "GET /health": "Health check"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "image-to-svg-api"
    }


@app.post("/analyse")
def analyse_endpoint(file: UploadFile = File(...)):
    """
    Analyse image quality without processing.

    Args:
        file: Uploaded image file (max 20MB)

    Returns:
        JSON with structured quality analysis results
    """
    temp_path = None

    try:
        # Read file bytes
        file_bytes = file.file.read()

        # Validate file type
        if not validate_image_file(file_bytes):
            logger.warning(f"Invalid file type uploaded: {file.filename}")
            raise HTTPException(
                status_code=422,
                detail=create_error_response(
                    "Invalid image format. Please upload JPEG or PNG.",
                    "INVALID_IMAGE_FORMAT"
                )
            )

        # Validate file size
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=create_error_response("Image too large. Maximum size allowed is 20MB.", "FILE_TOO_LARGE")
            )
        
        # Generate unique filename using UUID to avoid collisions
        file_extension = Path(file.filename).suffix # get file extension from original filename
        unique_filename = f"{uuid.uuid4()}{file_extension}" # new filename with unique UUID and original extension
        temp_path = UPLOAD_DIR / unique_filename
        
        # We need to save the file to disk because the analyse_image function expects a file path. 
        # TODO: Consider modifying analyse_image to accept file-like objects or byte streams to avoid this step.
        with open(temp_path, "wb") as f:
            f.write(file_bytes)
        
        logger.info(f"Analysing image: {unique_filename}")
        
        # Analyse
        analysis = analyse_image(str(temp_path))
        
        # Cleanup
        temp_path.unlink()
        
        # Return structured response
        return JSONResponse(content=create_success_response(
            data={},
            analysis={
                "metrics": {
                    "brightness": analysis['luminance']['global_mean'] / 255,
                    "contrast": analysis['contrast']['std_dev'] / 127,
                    "blur_score": analysis['blur']['blur_ratio'],
                    "resolution": [
                        analysis['resolution']['width'],
                        analysis['resolution']['height']
                    ]
                },
                "warnings": analysis.get('warnings', [])
            }
        ))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        
        # Cleanup on error
        if temp_path and temp_path.exists():
            temp_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=create_error_response(str(e))
        )


@app.post("/generate-svg")
def generate_svg_endpoint(
    file: UploadFile = File(...),
    style: StyleOption = Form(StyleOption.contour),
    skip_preprocess: bool = Form(False)
):
    """
    \Convert photo to SVG.
    Returns SVG content inline (no file storage).

    Args:
        file: Uploaded image file (max 20MB)
        style: Line art style ('contour' or 'anime')
        skip_preprocess: Skip preprocessing step

    Returns:
        JSON with SVG string and metadata
    """
    temp_input = None
    temp_output = None

    try:
        # Read file bytes
        file_bytes = file.file.read()

        # Validate file size
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=create_error_response("File too large. Maximum size is 20MB.", "FILE_TOO_LARGE")
            )

        # Validate file type
        if not validate_image_file(file_bytes):
            logger.warning(f"Invalid file type uploaded: {file.filename}")
            raise HTTPException(
                status_code=422,
                detail=create_error_response(
                    "Invalid image format. Please upload JPEG or PNG.",
                    "INVALID_IMAGE_FORMAT"
                )
            )

        # Generate unique filenames
        input_extension = Path(file.filename).suffix
        unique_id = str(uuid.uuid4())
        temp_input = UPLOAD_DIR / f"{unique_id}{input_extension}" # input the file as its original format (jpg or png)
        temp_output = UPLOAD_DIR / f"{unique_id}.svg" # output an svg file
        
        # Write input to disk
        with open(temp_input, "wb") as f:
            f.write(file_bytes)
        
        logger.info(f"Processing image {unique_id} with style={style}, skip_preprocess={skip_preprocess}")
        
        # Run pipeline (timed to include preprocessing + lineart + vectorization)
        pipeline_start = time.time()
        result = pipeline.process(
            input_image=str(temp_input),
            output_svg=str(temp_output),
            style=style,
            skip_preprocess=skip_preprocess
        )
        total_time_ms = int((time.time() - pipeline_start) * 1000)
        
        # Check if successful
        if not result['success']:
            logger.error(f"Pipeline failed: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=create_error_response(result['error'])
            )
        
        # Read SVG content and strip potrace metadata block with Portrace version info and processing parameters (not needed for client and adds unnecessary size)
        with open(temp_output, 'r') as f:
            svg_content = f.read()
        svg_content = re.sub(r'<metadata>.*?</metadata>\n?', '', svg_content, flags=re.DOTALL)
        
        logger.info(f"Successfully processed {unique_id}: {result['metrics']['path_count']} paths")
        
        # Cleanup temp files
        temp_input.unlink()
        temp_output.unlink()
        
        # Return structured response with inline SVG
        return JSONResponse(content=create_success_response(
            data={
                "svg": svg_content,
                "style": style,
                "preprocessing_applied": result.get('preprocessing_applied', [])
            },
            analysis={
                "metrics": {
                    "total_time_ms": total_time_ms,
                    "lineart_time_ms": int(result['metrics']['lineart_time'] * 1000),
                    "vectorization_time_ms": int(result['metrics']['vectorization_time'] * 1000),
                    "path_count": result['metrics']['path_count'],
                    "file_size_kb": result['metrics']['file_size_kb']
                },
                "warnings": result.get('warnings', [])
            }
        ))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SVG generation error: {str(e)}", exc_info=True)
        
        # Cleanup on error
        if temp_input and temp_input.exists():
            temp_input.unlink()
        if temp_output and temp_output.exists():
            temp_output.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Internal processing error")
        )


def main():
    """Run the FastAPI server."""
    logger.info("Starting Image to SVG API server...")
    logger.info(f"Models directory: {MODELS_DIR}")
    logger.info("Server will run on http://localhost:8000")
    logger.info("API docs available at http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

if __name__ == "__main__":
    main()