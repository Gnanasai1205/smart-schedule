const cron = require('node-cron');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

const initCronJobs = (io) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find all active sessions where endTime has passed
      const expiredSessions = await Session.find({
        isActive: true,
        endTime: { $lte: now }
      });

      if (expiredSessions.length > 0) {
        console.log(`[Cron] Found ${expiredSessions.length} expired sessions. Locking...`);

        for (const session of expiredSessions) {
          session.isActive = false;
          await session.save();

          // Emit to teacher & students
          if (io) {
            io.to(`class_${session.class}`).emit('sessionEnded', { 
               sessionId: session._id, 
               classId: session.class 
            });
          }
        }
      }

      // (Optional requirement fallback: What if teacher NEVER started it?)
      // To strictly enforce "no scan = absent" even if teacher didn't start a session,
      // we would need to check Timetable items that finished in the last minute. 
      // However, that requires complex lookups linking users->timetable->slots->classes.
      // With our current flow, 'Absent' is injected ON 'startSession'. 
      // By auto-closing expired started sessions here, we ensure no late scans are allowed.

    } catch (error) {
      console.error('[Cron] Error checking expired sessions:', error);
    }
  });

  console.log('[Cron] Automated Session Enforcement initialized.');
};

module.exports = initCronJobs;
