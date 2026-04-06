// models/Period.js
const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  school:{type:mongoose.Schema.ObjectId, ref:'School'},
  teacher: {   type: mongoose.Schema.Types.ObjectId,  ref: 'Teacher',   required: true, },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',  },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true,},
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true,},
  period_code: { type: String, default:'',},
  period_name: { type: String, default:'',},
  starttime: { type: String, required: true,},
  endtime: { type: String,  required: true,},
  days:[]
}, { timestamps: true });

module.exports = mongoose.model('Period', periodSchema);
