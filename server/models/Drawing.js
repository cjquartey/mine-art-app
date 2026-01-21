const mongoose = require('mongoose');
const {Schema} = mongoose;

const drawingSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },

    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },

    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    sessionId: {
        type: String,
        default: null
    },

    isGuest: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        default: null
    },

    svgFileId: {
        type: Schema.Types.ObjectId,
        ref: 'drawingsBucket.files'
    },

    originalFileName: {
        type: String
    },

    processedStyle: {
        type: String,
        // Will later be restricted to an array of style options
    },

    status: {
        type: String,
        enum: ['processing', 'complete', 'failed']
    },

    errorMessage: {
        type: String,
        default: null
    },

    processingStartedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

drawingSchema.index({sessionId: 1});
drawingSchema.index({projectId: 1});
drawingSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

module.exports = mongoose.model('Drawing', drawingSchema);