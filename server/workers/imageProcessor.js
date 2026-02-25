const {Readable} = require('stream');
const fs = require('fs');
const connectDB = require('../config/database');
const Drawing = require('../models/Drawing');
const processImage = require('../services/imageProcessingServices');
const addPathIds = require('../utils/svgProcessor');
const {storeFile} = require('../config/gridfs');

process.on('uncaughtException', (error) => {
    console.error(`Uncaught exception: ${error}`);
    process.exit(1);
});

async function processJobs(){
    while(true){
        const job = await Drawing.findOne({status: 'queued'}).sort({ createdAt: 1 });
        if (job) {
            await handleJob(job);
        } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function handleJob(drawing) {
    try{
        await Drawing.findByIdAndUpdate(
            drawing._id, 
            {
                status: 'processing',
                processingStartedAt: new Date()
            },
            {
                new: true
            }
        );

        const imagePath = drawing.originalFilePath;
        let svgResult; // Declare svgResult here to use it in the catch block if processImage throws an error
        try{
            svgResult = await processImage(imagePath, drawing.processedStyle);
        } catch(error) {
            await Drawing.findByIdAndUpdate(drawing._id, {
                status: 'failed',
                errorMessage: error.message
            });
            return;
        }

        // Process SVG
        const processedSVG = addPathIds(svgResult.svg);
    
        // Convert string to stream for GridFS storage
        const svgStream = Readable.from([processedSVG]);
    
        let svgFileId;
        try{
            svgFileId = await storeFile(svgStream, `${drawing.name}.svg`);
        } catch(error) {
            await Drawing.findByIdAndUpdate(drawing._id, {
                status: 'failed',
                errorMessage: error.message
            });
            return;
        } 
    
        // Update SVG
        await Drawing.findByIdAndUpdate(drawing._id, {
            status: 'complete',
            svgFileId: svgFileId,
            processedStyle: drawing.processedStyle
        });
    } catch(error) {
        console.error(`Job failed: ${error}`);
    } finally {
        // Cleanup the temporary file upload
        if (drawing.originalFilePath && fs.existsSync(drawing.originalFilePath)) {
            fs.unlinkSync(drawing.originalFilePath);
        }
    }
}
(async () => {
    try{
        await connectDB();
        await processJobs();
    } catch(error) {
        console.error(`Worker failed to start: ${error}`);
        process.exit(1);
    }
})();