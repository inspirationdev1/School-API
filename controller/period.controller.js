const Period = require('../model/period.model');

// Controller to create a period
exports.createPeriod = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const classId = req.body.class;
    const sectionId = req.body.section;
    const subjectId = req.body.subject;
    const teacherId = req.body.teacher;
    const startminutes = toMinutes(req.body.starttime);
    const endminutes = toMinutes(req.body.endtime);

    let paramsDuplicate = {
      school: schoolId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      teacher: teacherId,
      id: "",
      starttime: req.body.starttime || "00:00",
      endtime: req.body.endtime || "00:00",
      startminutes: startminutes || 1,
      endminutes: endminutes || 1,
      days: req.body.days || [],
    }

    let isDuplicate = false;
    let duplicateMessage = "";
    const objCheckDuplicate = await checkDuplicate(paramsDuplicate);

    if (objCheckDuplicate) {
      isDuplicate = objCheckDuplicate?.isDuplicate;
      duplicateMessage = objCheckDuplicate?.message;
    }


    if (isDuplicate) {
      console.log("isDuplicate", isDuplicate);
      res.status(500).json({ success: false, message: duplicateMessage });
      return;
    }

    req.body.startminutes = startminutes || 1;
    req.body.endminutes = endminutes || 1;
    req.body.timeseq = startminutes || 1;


    const newPeriod = new Period({ ...req.body, school: schoolId });

    await newPeriod.save();
    let params = {
      class: classId,
      section: sectionId
    }

    const periodSeq = await Period.find(params).sort({ timeseq: 1 }).lean();
    console.log("periodSeq", periodSeq);
    let subseq = 0;
    for (const item of periodSeq) {
      subseq += 1;
      const id = item._id;
      const subjectkey = "subject" + subseq;
      item.subjectkey = subjectkey;
      const updatedPeriodSeq = await Period.findOneAndUpdate({ _id: id }, { $set: { ...item } });
      console.log("updatedPeriodSeq", updatedPeriodSeq);
      // code
    }

    res.status(201).json({ success: true, message: 'Period assigned successfully', period: newPeriod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating period', error });
    console.log("Error", error)
  }
};

// Controller to get periods for a specific teacher
exports.getTeacherPeriods = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { teacherId } = req.params;
    const periods = await Period.find({ teacher: teacherId, school: schoolId }).populate('class').populate('subject');
    res.status(200).json({ periods });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching periods', error });
  }
};

exports.getPeriodsWithId = async (req, res) => {
  try {
    const { id } = req.params;
    const period = await Period.findById(id).populate('class').populate('section').populate('subject').populate('teacher');
    // res.status(200).json({ period });
    if (period) {
      res.status(200).json({ success: true, data: period })
    } else {
      res.status(500).json({ success: false, message: "Periods data not Available" })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching periods by id', error });
  }
};

// Controller to get periods for a specific CLASS
exports.getClassPeriods = async (req, res) => {

  try {
    const { classId } = req.params;
    const schoolId = req.user.schoolId;
    const periods = await Period.find({ class: classId, school: schoolId }).populate('subject').populate('teacher');
    console.log(classId)
    res.status(200).json({ periods });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching periods', error });
  }
};

// all periods
exports.getPeriods = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const periods = await Period.find({ school: schoolId }).populate('class').populate('section').populate('subject').populate("teacher").populate("school")
    // res.status(200).json(periods);
    res.status(200).json({ success: true, message: "Success in fetching all  Periods", data: periods })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching periods', error });
  }
};


// Update period
exports.updatePeriod = async (req, res) => {

  try {

    const schoolId = req.user.schoolId;

    const id = req.params.id;
    const classId = req.body.class;
    const sectionId = req.body.section;
    const subjectId = req.body.subject;
    const teacherId = req.body.teacher;
    const startminutes = toMinutes(req.body.starttime);
    const endminutes = toMinutes(req.body.endtime);

    let paramsDuplicate = {
      school: schoolId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      teacher: teacherId,
      id: id,
      starttime: req.body.starttime || "00:00",
      endtime: req.body.endtime || "00:00",
      startminutes: startminutes || 1,
      endminutes: endminutes || 1,
      days: req.body.days || [],
    }

    let isDuplicate = false;
    let duplicateMessage = "";
    const objCheckDuplicate = await checkDuplicate(paramsDuplicate);

    if (objCheckDuplicate) {
      isDuplicate = objCheckDuplicate?.isDuplicate;
      duplicateMessage = objCheckDuplicate?.message;
    }


    if (isDuplicate) {
      console.log("isDuplicate", isDuplicate);
      res.status(500).json({ success: false, message: duplicateMessage });
      return;
    }

    req.body.startminutes = startminutes || 1;
    req.body.endminutes = endminutes || 1;
    req.body.timeseq = startminutes || 1;

    updatedPeriod = await Period.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
    let params = {
      class: classId,
      section: sectionId
    }
    const periodSeq = await Period.find(params).sort({ timeseq: 1 }).lean();
    console.log("periodSeq", periodSeq);
    let subseq = 0;
    for (const item of periodSeq) {
      subseq += 1;
      const id = item._id;
      const subjectkey = "subject" + subseq;
      item.subjectkey = subjectkey;
      const updatedPeriodSeq = await Period.findOneAndUpdate({ _id: id }, { $set: { ...item } });
      console.log("updatedPeriodSeq", updatedPeriodSeq);
      // code
    }

    res.status(200).json({ success: true, message: 'Period updated successfully', period: updatedPeriod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating period', error });
  }
};

// Delete period
exports.deletePeriod = async (req, res) => {
  try {
    const periodId = req.params.id;
    await Period.findByIdAndDelete(periodId);
    res.status(200).json({ message: 'Period deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting period', error });
  }
};

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

checkDuplicate = async (paramsDuplicate) => {

  let objCheckDuplicate = { isDuplicate: false, message: "" };
  let isDuplicate = false;


  let existingId = paramsDuplicate.id;
  let currentstarttime = paramsDuplicate.starttime;
  let currentendtime = paramsDuplicate.endtime;
  let curretdays = paramsDuplicate.days || [];

  try {
    let params = {
      class: paramsDuplicate.class,
      section: paramsDuplicate.section
    }
    const periodDuplicate = await Period.find(params).sort({ timeseq: 1 }).lean();
    console.log("periodDuplicate", periodDuplicate);
    if (periodDuplicate.length > 0) {
      let subjectId = paramsDuplicate.subject || "";
      isDuplicate = periodDuplicate.some(
        item => item._id.toString() !== existingId && item.subject.toString() === subjectId.toString()
      );
      if (isDuplicate) {
        objCheckDuplicate = { isDuplicate: isDuplicate, message: "Class , Section & Subject is duplicating" };
        return objCheckDuplicate;
      }

      for (const item of periodDuplicate) {
        const startminutes = toMinutes(item.starttime);
        const endminutes = toMinutes(item.endtime);
        const currentstartminutes = toMinutes(currentstarttime) + 1;
        const currentendminutes = toMinutes(currentendtime);

        if (item._id.toString() !== existingId) {
          const days = item.days || [];
          console.log("days", days);
          console.log("curretdays", curretdays);
          const isAnyPresent = curretdays.some(
            day => days.includes(day)
          );

          console.log(isAnyPresent);

          if ((currentstartminutes >= startminutes && currentstartminutes <= endminutes) && isAnyPresent) {
            isDuplicate = true;
            objCheckDuplicate = { isDuplicate: isDuplicate, message: "Start time is duplicating/overlaping" };
            return objCheckDuplicate;
            // break;
          }
          if (item.starttime == "12:00") {
            console.log("starttime:" + item.starttime);
          }
          if ((currentendminutes >= startminutes + 1 && currentendminutes <= endminutes) && isAnyPresent) {
            isDuplicate = true;
            objCheckDuplicate = { isDuplicate: isDuplicate, message: "End time is duplicating/overlaping" };
            return objCheckDuplicate
            // break;
          }
        }
      }
    }


    let paramsTeacher = {
      teacher: paramsDuplicate.teacher
    }
    const periodTeacherData = await Period.find(paramsTeacher).sort({ timeseq: 1 }).lean();
    console.log("periodTeacherData", periodTeacherData);
    if (periodTeacherData.length > 0) {
      for (const item of periodTeacherData) {
        const startminutes = toMinutes(item.starttime);
        const endminutes = toMinutes(item.endtime);
        const currentstartminutes = toMinutes(currentstarttime);
        const currentendminutes = toMinutes(currentendtime);
        if (item.starttime == "11:00" || item.starttime == "12:00") {
          console.log("starttime:" + item.starttime);
        }
        if (item._id.toString() !== existingId) {
          const days = item.days || [];
          console.log("days", days);
          console.log("curretdays", curretdays);
          const isAnyPresent = curretdays.some(
            day => days.includes(day)
          );

          console.log(isAnyPresent);
          if ((currentstartminutes + 1 >= startminutes && currentstartminutes + 1 <= endminutes) && isAnyPresent) {
            isDuplicate = true;
            objCheckDuplicate = { isDuplicate: isDuplicate, message: "Teacher , Starttime is duplicating/overlaping" };
            return objCheckDuplicate;
            // break;
          }

          if ((currentendminutes >= startminutes + 1 && currentendminutes <= endminutes) && isAnyPresent) {
            isDuplicate = true;
            objCheckDuplicate = { isDuplicate: isDuplicate, message: "Teacher , Endtime is duplicating/overlaping" };
            return objCheckDuplicate;
            // break;
          }
        }
      }
    }


  } catch (error) {
    console.log("Duplicate function", error.message);
  }
  objCheckDuplicate = { isDuplicate: isDuplicate, message: "" };
  return objCheckDuplicate;
}



