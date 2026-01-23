const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the './temp/' directory exists
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        cb(null, './temp/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);

        cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
});

function fileFilter(req, file, cb){
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Only allowed types are ${allowedTypes.join(', ')}`));
    }
};

const upload = multer({
    storage,
    limits: {fileSize: 20000000}, // 20MB  file size limit
    fileFilter
}).single('image');

module.exports = upload;