module.exports = {
  apps: [
    {
      name: 'anton-prod',
      script: 'server.js',
      watch: true,
      env: {
        PORT: 8080,
        NODE_ENV: 'production',
      },
      merge_logs: true,
      cwd: '/home/ubuntu/deploy/dist-prod/',
      interpreter: 'node@16.13.1',
    },
    {
      name: 'anton',
      script: 'server.js',
      watch: true,
      env: {
        PORT: 8081,
        NODE_ENV: 'staging',
      },
      merge_logs: true,
      cwd: '/home/ubuntu/deploy/dist/',
      interpreter: 'node@16.13.1',
    },
  ],
}
