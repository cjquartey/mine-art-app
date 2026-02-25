const fs = require('fs'); // module for file system operations
const path = require('path'); // module for handling file paths

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const FASTAPI_TIMEOUT_MS = 60000; // timeout for FastAPI requests after 60 seconds

async function processImage(imagePath, style) {
    // Make sure the image file exists before trying to read it
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
    }

    // Read the image file into a buffer and create a Blob for the multipart/form-data request
    // A blob is a binary large object that can represent file-like data, which is needed for the FormData API
    const imageBuffer = await fs.promises.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'; // default to jpeg if not png
    // mime is a standard way to indicate the type of file being sent, which helps the server understand how to process it
    const blob = new Blob([imageBuffer], { type: mimeType });

    // Create a FormData object to send the image file and parameters to the FastAPI endpoint
    const form = new FormData();
    form.append('file', blob, path.basename(imagePath));
    form.append('style', style);
    form.append('skip_preprocess', 'false');

    // Use AbortController to implement a timeout for the fetch request to FastAPI
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(`${FASTAPI_URL}/generate-svg`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('FastAPI request timed out after 60s');
        }
        throw new Error(`FastAPI unreachable: ${error.message}`);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`FastAPI returned ${response.status}: ${text.slice(0, 200)}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error?.message || 'FastAPI processing failed');
    }

    return {
        svg: result.data.svg,
        warnings: result.analysis?.warnings ?? [],
        metrics: result.analysis?.metrics ?? {}
    };
}

module.exports = processImage;
