
const Attendance = require('../model/attendance.model');
const moment = require('moment')
module.exports = {
  markAttendance: async (req, res) => {
    const { studentId, date, status, classId,sectionId } = req.body;
    const schoolId = req.user.schoolId;
    
// const [h, m] = time.split(":").map(Number);
    const [dd, mm,yyyy] = date.split("-").map(Number);

    let  attendance_date= new Date(Date.UTC(yyyy, mm - 1, dd));
    const selectedDate = moment(attendance_date, "YYYY-MM-DD").startOf('day');
    

    try {
      const updatedAttendance = await Attendance.findOneAndUpdate(
        {
          student: studentId,
          class: classId,
          section: sectionId,
          date: {
          $gte: selectedDate.toDate(), // Check if attendance date is greater than or equal to today's date
          $lt: moment(selectedDate).endOf('day').toDate(), // Less than the end of today
        }
        },
        { status: status },
        { new: true }
      );
      console.log(updatedAttendance);
      if (updatedAttendance) {

        res.status(201).json(updatedAttendance);
      } else {
        const attendance = new Attendance({ student: studentId, date:attendance_date, status, class: classId,section: sectionId, school: schoolId });
        await attendance.save();
        res.status(201).json(attendance);
      }

    } catch (err) {
      res.status(500).json({ message: 'Error marking attendance', err });
    }
  },
  getAttendance: async (req, res) => {
    const { studentId } = req.params;

    try {
      const attendance = await Attendance.find({ student: studentId }).populate('student');
      res.status(200).json(attendance);
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Error fetching attendance', err });
    }
  }
  ,
  // Check if attendance is already taken for today
  checkAttendance: async (req, res) => {
    try {
      const today = moment().startOf('day'); // Get the start of today (00:00:00)


      const { classId,sectionId, selectedDate } = req.query;

      const [dd, mm,yyyy] = selectedDate.split("-").map(Number);

    let  attendance_date= new Date(Date.UTC(yyyy, mm - 1, dd));
    // selectedDate = moment(attendance_date, "YYYY-MM-DD").startOf('day');
   

      const dateMoment = moment(attendance_date, "YYYY-MM-DD").startOf('day');
      // Query the database for any attendance record for today
      const attendanceForToday = await Attendance.find({
        class: classId,
        section:sectionId,
        date: {
          $gte: dateMoment.toDate(), // Check if attendance date is greater than or equal to today's date
          $lt: moment(dateMoment).endOf('day').toDate(), // Less than the end of today
        },
      }).lean();
      

      if (attendanceForToday.length>0) {
        return res.status(200).json({ attendanceTaken: true, data: attendanceForToday, message: 'Attendance already taken for today' });
      } else {
        return res.status(200).json({ attendanceTaken: false,message: 'No attendance taken yet for today' });
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  }
  ,
  // Check if attendance is already taken for today
  printAttendance: async (req, res) => {
    try {
      const today = moment().startOf('day'); // Get the start of today (00:00:00)

      const { classId, selectedDate } = req.query;
      // const dateMoment = moment(selectedDate, "YYYY-MM-DD").startOf('day');

    const [dd, mm,yyyy] = selectedDate.split("-").map(Number);
    let  attendance_date= new Date(Date.UTC(yyyy, mm - 1, dd));
    const dateMoment = moment(attendance_date, "YYYY-MM-DD").startOf('day');


      // Query the database for any attendance record for today
      const attendanceForToday = await Attendance.find({
        class: classId,
        date: {
          $gte: dateMoment.toDate(), // Check if attendance date is greater than or equal to today's date
          $lt: moment(dateMoment).endOf('day').toDate(), // Less than the end of today
        },
      }).populate({
        path: 'student',
        select: 'name age gender guardian guardian_phone'
      }).populate({
        path: 'school',
        select: 'school_name school_image email address city state zipcode country'
      }).lean();


      if (attendanceForToday) {
        const counts = attendanceForToday.reduce(
          (acc, curr) => {
            if (curr.status === "Present") acc.present++;
            if (curr.status === "Absent") acc.absent++;
            return acc;
          },
          { present: 0, absent: 0 }
        );

        console.log(counts);
        return res.status(200).json({ attendanceTaken: true, data: attendanceForToday, counts: counts });
      } else {
        return res.status(200).json({ attendanceTaken: false, data: [] });
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  }

}
