{
  "apps": [
    {
      "name": "nestAdmin",
      "script": "./dist/main.js",
      "cwd": "/home/nestadmin/backend",
      "instances": "1",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USERNAME": "root",
        "DB_PASSWORD": "your_password",
        "DB_DATABASE": "nest_admin"
      },
      "error_file": "/var/log/nestadmin-error.log",
      "out_file": "/var/log/nestadmin-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "max_memory_restart": "500M",
      "max_restarts": 10,
      "min_uptime": "10s",
      "watch": false,
      "ignore_watch": ["node_modules", "dist/logs"]
    }
  ]
}
