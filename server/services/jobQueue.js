const crypto = require("crypto");

const queue = new Map();

const jobQueue = {
    addJob: function(jobData) {
        let jobId = crypto.randomUUID();
        const job = {
            jobId,
            drawingId: jobData.drawingId,
            imagePath: jobData.imagePath,
            style: jobData.style,
            addedAt: new Date(),
            attempts: jobData.attempts || 0
        }
        queue.set(jobId, job);
        return jobId;
    },

    getNextJob: function() {
        if (queue.size === 0) return null;

        const firstJobId = queue.keys().next().value;
        const job = queue.get(firstJobId);

        queue.delete(firstJobId);
        return job;
    },

    getQueueSize: function() {
        return queue.size;
    }
}


module.exports = jobQueue;