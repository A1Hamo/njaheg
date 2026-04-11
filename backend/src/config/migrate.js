// src/config/migrate.js — Run migrations standalone
require('dotenv').config();
const { connectPostgres } = require('./postgres');
const logger = require('../utils/logger');

connectPostgres()
  .then(() => { logger.info('✅ Migrations complete'); process.exit(0); })
  .catch(err => { logger.error('Migration error:', err); process.exit(1); });
