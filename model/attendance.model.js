const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  school:{type:mongoose.Schema.ObjectId, ref:'School'},
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class:{type:mongoose.Schema.Types.ObjectId, ref:"Class"},
  section:{type:mongoose.Schema.Types.ObjectId, ref:"Section"},
  date: { type: Date, required: true },
  year: { type: Number, default: new Date().getFullYear() },
  month: { type: Number, default: new Date().getMonth() + 1 },
  month_name: { type: String, default: '' },
  attendance_flag: { type: Number, default: 1 },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
