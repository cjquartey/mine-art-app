const mongoose = require('mongoose');
const {Schema} = mongoose;

const projectSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },

    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    collaborators: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);