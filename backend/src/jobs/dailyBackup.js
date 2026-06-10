const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

const SCRIPT = path.join(__dirname, '../../scripts/backup-db.sh');

function startDailyBackup() {
  return cron.schedule('0 2 * * *', () => {
    const ts = new Date().toISOString();
    exec(SCRIPT, (err, stdout, stderr) => {
      if (err) {
        console.error(`[backup] ${ts} FAILED:`, err.message);
        return;
      }
      console.log(`[backup] ${ts} Completed`);
      if (stderr) console.warn('[backup] stderr:', stderr);
    });
  });
}

module.exports = { startDailyBackup };
