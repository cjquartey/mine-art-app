const mongoose = require('mongoose');
const {Schema} = mongoose;

const collaborationRequestSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required']
    },

    recipientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required']
    },

    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project is required']
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'left'],
        default: 'pending'
    }
},{
    timestamps: true
});

collaborationRequestSchema.index({senderId: 1, recipientId: 1, projectId: 1, status: 1});

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);