const env = require('./src/config/env');
const { connectAll } = require('./src/config/db');
const { app, server, io } = require('./src/app');
const { startSimulation } = require('./src/jobs/simulateTracking.job');

async function start() {
  try {
    await connectAll();
    server.listen(env.PORT, () => {
      console.log(`🚀 Waystone API running on port ${env.PORT} (${env.NODE_ENV})`);
    });
    startSimulation(io);
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();