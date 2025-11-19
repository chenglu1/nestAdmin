module.exports = {
  apps: [
    {
      name: 'nestAdmin-backend',
      script: './dist/main.js',
      cwd: './backend',
      instances: 'max', // 根据 CPU 核心数自动设置
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // 自动重启配置
      autorestart: true,
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // 监控配置
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      // 优雅重启
      kill_timeout: 5000,
      listen_timeout: 3000,
      // 健康检查
      health_check: {
        url: 'http://localhost:3001/api/health',
        interval: 30000,
      },
    },
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: '118.89.79.13',
      ref: 'origin/main',
      repo: 'git@github.com:chenglu1/nestAdmin.git',
      path: '/home/deploy/nestAdmin',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
