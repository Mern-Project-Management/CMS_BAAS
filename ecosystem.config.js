module.exports = {
  apps: [
    {
      name: "cms-baas",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3012",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
