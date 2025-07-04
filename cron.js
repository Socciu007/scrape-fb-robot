const cron = require('node-cron');

// Time task fb
const timeTaskScrapeFb = async (task) => {
  try {
    // Run task at 6:30 AM every day (minute/hour/dayOfMonth/month/dayOfWeek)
    const taskAt = cron.schedule('30 9 * * *', async () => {
      try {
        await task(); // Call the async task
      } catch (err) {
        console.error('Error during scheduled task:', err);
      }
    });
    taskAt.start();
    // Stop the task at 6:00 PM every day
    const stopTaskAt6PM = cron.schedule('21 11 * * *', () => {
      taskAt.stop();
    });
    stopTaskAt6PM.start();
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

module.exports = {
  timeTaskScrapeFb
}