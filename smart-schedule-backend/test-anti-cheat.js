require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Class = require('./src/models/Class');
const Attendance = require('./src/models/Attendance');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-schedule");
    console.log("Connected to MongoDB for testing.");

    // Clean up
    await User.deleteMany({ email: { $in: ['test_teach@example.com', 'test_stud@example.com'] } });

    // 1. Create Teacher
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'test_teach@example.com',
      password: 'password123',
      role: 'Teacher',
      status: 'approved'
    });

    // 2. Create Student
    const student = await User.create({
      name: 'Test Student',
      email: 'test_stud@example.com',
      password: 'password123',
      role: 'Student',
      status: 'approved'
    });

    // 3. Create Class
    const classDoc = await Class.create({
      name: 'Test Subject',
      subjectCode: 'TST101',
      teacher: teacher._id
    });

    // 4. Generate QR Token manually mimicking generateQR
    const qrData = {
      classId: classDoc._id,
      teacherId: teacher._id,
      teacherIP: '192.168.1.100', // Mocking teacher connected on WiFi
      teacherLat: 17.385044,      // Mocking teacher location (Hyderabad)
      teacherLng: 78.486671,
      timestamp: Date.now()
    };
    const qrToken = jwt.sign(qrData, process.env.JWT_SECRET, { expiresIn: '15s' });
    console.log("Generated 15s QR Token successfully.");

    // Helper to mock the Express req/res
    const markAttendanceMock = async (studentIP, studentLat, studentLng, deviceId) => {
      const { markAttendance } = require('./src/controllers/attendance.controller');
      
      let resMessage = null;
      let resStatus = 200;
      
      const req = {
        app: { get: () => ({ to: () => ({ emit: () => {} }) }) }, 
        user: student,
        ip: studentIP,
        body: { qrToken, studentLat, studentLng, deviceId },
        connection: {}
      };
      const res = {
        status: (code) => { resStatus = code; return res; },
        json: (data) => { resMessage = data.message || "Success"; return res; }
      };

      try {
        await markAttendance(req, res);
        return { status: resStatus, message: resMessage };
      } catch (e) {
        return { status: 500, message: e.message };
      }
    };

    console.log("\n--- Executing Anti-Cheat Suite ---\n");

    // Test A: IP Mismatch
    console.log("Test A: Student tries to mark attendance on Mobile Data (IP Mismatch)");
    const resA = await markAttendanceMock('203.0.113.45', 17.385044, 78.486671, 'dev-123');
    console.log(`Expected status 403. Actual: ${resA.status} | MSG: ${resA.message}`);
    if(!resA.message.includes('IP mismatch')) throw new Error("IP test failed");

    // Test B: Geolocation Mismatch (> 30 meters)
    console.log("\nTest B: Student uses correct IP but is far away (Geo Mismatch)");
    // 17.386, 78.486 is effectively ~100+ meters away from 17.385044
    const resB = await markAttendanceMock('192.168.1.100', 17.386000, 78.486671, 'dev-123');
    console.log(`Expected status 403. Actual: ${resB.status} | MSG: ${resB.message}`);
    if(!resB.message.includes('Proximity mismatch')) throw new Error("Geo test failed");

    // Test C: Valid Scenario (Initial Device Binding)
    console.log("\nTest C: Student is perfectly matched (Binding Device ID)");
    const resC = await markAttendanceMock('192.168.1.100', 17.385049, 78.486671, 'dev-123');
    console.log(`Expected status 201/200. Actual: ${resC.status} | MSG: ${resC.message}`);

    // Test D: Device Mismatch (Buddy proxy attempt)
    console.log("\nTest D: Proxy buddy tries to login using Student account on a different phone");
    // Even if IP/Geo matches, the deviceID is different
    const studentFresh = await User.findById(student._id);
    const reqD = {
      app: { get: () => ({ to: () => ({ emit: () => {} }) }) }, 
      user: studentFresh, 
      ip: '192.168.1.100',
      body: { qrToken, studentLat: 17.385049, studentLng: 78.486671, deviceId: 'HACKER-PHONE-456' },
      connection: {}
    };
    const resDObj = {};
    const resD = {
      status: (code) => { resDObj.status = code; return resD; },
      json: (data) => { resDObj.message = data.message; return resD; }
    };
    await require('./src/controllers/attendance.controller').markAttendance(reqD, resD);
    console.log(`Expected status 403. Actual: ${resDObj.status} | MSG: ${resDObj.message}`);
    if(!resDObj.message.includes('Device mismatch')) throw new Error("Device logic failed");

    console.log("\n✅ ALL ANTI-CHEAT PROOFS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Test Failed:", err);
    process.exit(1);
  }
})();
