const cron = require('node-cron');

// Time task fb
const timeTaskScrapeFb = async (task) => {
  try {
    // Run task at 10:30 AM every day (minute/hour/dayOfMonth/month/dayOfWeek)
    const taskAt = cron.schedule('30 10 * * *', async () => {
      try {
        await task(); // Call the async task
      } catch (err) {
        console.error('Error during scheduled task:', err);
      }
    });
    taskAt.start();

    // Run task at 9:30 AM every day (minute/hour/dayOfMonth/month/dayOfWeek)
    // const taskAt2 = cron.schedule('30 9 * * *', async () => {
    //   try {
    //     await task(); // Call the async task
    //   } catch (err) {
    //     console.error('Error during scheduled task:', err);
    //   }
    // });
    // taskAt2.start();

    // Run task at 1:00 PM every day (minute/hour/dayOfMonth/month/dayOfWeek)
    const taskAt3 = cron.schedule('45 13 * * *', async () => {
      try {
        await task(); // Call the async task
      } catch (err) {
        console.error('Error during scheduled task:', err);
      }
    });
    taskAt3.start();

    // Stop the task at 6:00 PM every day
    // const stopTaskAt6PM = cron.schedule('21 11 * * *', () => {
    //   taskAt.stop();
    // });
    // stopTaskAt6PM.start();
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

module.exports = {
  timeTaskScrapeFb
}