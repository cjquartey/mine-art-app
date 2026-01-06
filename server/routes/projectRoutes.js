const express = require('express');
const router = express.Router();

router.get('/user/:userId', (req, res) => {
    res.json({
        message: 'Projects route for one user'
    })
})

module.exports = router;