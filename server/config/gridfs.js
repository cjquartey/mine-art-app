const mongoose = require('mongoose');
const {ObjectId} = require('mongodb')

let bucket;

function initBucket() {
    const db = mongoose.connection.db;
    bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "drawingsBucket"
    });
    console.log(`${bucket.s.options.bucketName} initialised!`);
};

function checkBucket(){
    if (!bucket) {
        throw new Error("No GridFS bucket initialised");
    }
};

function storeFile(readableStream, fileName){
    checkBucket();
    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fileName);

        readableStream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => resolve(uploadStream.id));
    });
};

function retrieveFile(id){
    checkBucket();
    return bucket.openDownloadStream(new ObjectId(id));
};

async function deleteFile(id){
    checkBucket();
    await bucket.delete(new ObjectId(id));
    return (`File with id ${id} successfully deleted`);
};

module.exports = {
    initBucket,
    checkBucket,
    storeFile,
    retrieveFile,
    deleteFile
};