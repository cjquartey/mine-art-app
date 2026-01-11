const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required']
    },

    lastName: {
        type: String,
        required: [true, 'Last name is required']
    },

    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);