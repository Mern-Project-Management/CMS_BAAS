module.exports = {
  apps: [
    {
      name: "OSTECH_ADMIN",
      script: "npm",
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3032,
      },
    },
  ],
};