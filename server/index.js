require('dotenv').config();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const {createServer} = require('http');
const {Server} = require('socket.io');
const express = require('express');
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
const connectDB = require('./config/database');
const socketAuth = require('./socket/socketAuth');
const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const drawingRoutes = require('./routes/drawingRoutes');
const userRoutes = require('./routes/userRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const {fork} = require('child_process');
const initialiseSocket = require('./socket/socketManager');

let workerProcess = null;
// Middleware
app.use(cors());
app.use(express.json());
io.use(socketAuth)

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collaborations', collaborationRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'We are live, baby!'
    });
});

function startWorker() {
    workerProcess = fork('./workers/imageProcessor.js');

    workerProcess.on('error', (error) => {
        console.error(`Worker Error: ${error}`);
    })

    workerProcess.on('exit', (code, signal) => {
    console.log(`Worker Exited with code ${code}, signal ${signal}`);
        
        // Auto-restart if crashed unexpectedly (not manual shutdown)
        if (code !== 0 && code !== null) {
            setTimeout(() => {
                startWorker();
            }, 5000);
        }
    });

    console.log(`Worker started with PID: ${workerProcess.pid}`)
}

// Connect to database and server
const startServer = async () => {
    try{
        await connectDB();
        initialiseSocket(io);
        server.listen(PORT, () => {
            console.log(`Server running on Port ${PORT}...`);
        });
        startWorker();
    } catch(error){
        console.log(`Failed to start server! ${error.message}`);
        process.exit(1);
    }
}

startServer();

function shutdown(signal) {    
    if (workerProcess) {
        workerProcess.kill('SIGTERM');
        
        setTimeout(() => {
            if (workerProcess && !workerProcess.killed) {
                workerProcess.kill('SIGKILL');
            }
        }, 10000);
    }
    
    setTimeout(() => {
        process.exit(0);
    }, 11000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));