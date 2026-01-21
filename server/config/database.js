const mongoose = require('mongoose');
const {initBucket} = require('./gridfs');

async function connectDB(){
    try{
        await mongoose.connect(process.env.DATABASE_URI);
        console.log(`Connected to ${mongoose.connection.db.databaseName} database`)
        initBucket();
    } catch(error){
        console.log(`Connection failed! ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;