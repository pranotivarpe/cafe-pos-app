const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Enhanced CORS with explicit OPTIONS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);  // Allow preflight
    } else {
        next();
    }
});

app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'Backend OK' }));
app.use('/api/auth', require('./src/routes/auth'));
app.get('/api/protected', require('./src/middleware/auth'), (req, res) => {
    res.json({ msg: 'Protected OK', user: req.user });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
});
