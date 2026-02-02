module.exports = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(400).json({ error: 'Item already exists' });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};
