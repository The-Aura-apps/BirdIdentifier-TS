const dotenv = require('dotenv');
const path = require('path');

// Load .env file
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

console.log(' Environment variables loaded from:', envPath);

module.exports = {
  apps: [{
    name: 'bird-identifier',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    cwd: '/var/www/birdIdentifier/BirdIdentifier-Backend',
    
    // Pass all environment variables from .env
    env: {
      ...process.env,  // This includes all variables from dotenv.config()
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    error_file: '/var/www/birdIdentifier/BirdIdentifier-Backend/logs/error.log',
    out_file: '/var/www/birdIdentifier/BirdIdentifier-Backend/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};