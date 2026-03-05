require('dotenv').config();
const express = require('express');
const pino = require('pino');

// Configuration du logger JSON
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => { return { level: label.toUpperCase() }; },
  },
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware d'observabilité : logue chaque requête entrante
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
  next();
});

// Route métier principale
app.get('/', (req, res) => {
  res.json({ 
    service: 'Payment API', 
    version: '1.0.0', 
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route Health Check (CRITIQUE pour le déploiement)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  logger.info({ port }, 'Server started successfully');
});

// Gestion du Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
});