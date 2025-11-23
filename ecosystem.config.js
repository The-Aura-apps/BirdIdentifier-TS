module.exports = {
  apps: [{
    name: 'bird-identifier',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1.8G',
    cwd: '/var/www/bird-identifier/BirdIdentifier-Backend',
    env_file: '/var/www/bird-identifier/BirdIdentifier-Backend/.env',
    error_file: '/var/www/bird-identifier/logs/error.log',
    out_file: '/var/www/bird-identifier/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
