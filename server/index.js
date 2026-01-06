require('dotenv').config();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const express = require('express');
const app = express();
const connectDB = require('./config/database');
const projectRoutes = require('./routes/projectRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'We are live, baby!'
    });
});

// Connect to database and server
const startServer = async () => {
    try{
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on Port ${PORT}...`);
        })
    } catch(error){
        console.log(`Failed to start server! ${error.message}`);
        process.exit(1);
    }
}

startServer();