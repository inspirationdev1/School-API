const Period = require('../model/period.model');

// Controller to create a period
exports.createPeriod = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const classId = req.body.class;
    const sectionId = req.body.section;
    const subjectId = req.body.subject;
    const teacherId = req.body.teacher;

    let paramsDuplicate = {
      school: schoolId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      teacher: teacherId,
      id: ""
    }
    const isDuplicate = await checkDuplicate(paramsDuplicate);
    if (isDuplicate) {
      console.log("isDuplicate", isDuplicate);
      res.status(500).json({ success: false, message: 'Error Duplicatiing period' });
      return;
    }


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

    let paramsDuplicate = {
      school: schoolId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      teacher: teacherId,
      id: id,
      starttime: req.body.starttime || "00:00"
    }
    const isDuplicate = await checkDuplicate(paramsDuplicate);
    if (isDuplicate) {
      console.log("isDuplicate", isDuplicate);
      res.status(500).json({ success: false, message: 'Error Duplicatiing period' });
      return;
    }

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

  let isDuplicate = false;

  let existingId = paramsDuplicate.id;
  let currenttime = paramsDuplicate.starttime;


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
        return isDuplicate;
      }

      for (const item of periodDuplicate) {
        const startminutes = toMinutes(item.starttime);
        const endminutes = toMinutes(item.endtime);
        const currentminutes = toMinutes(currenttime);
        if (item._id.toString() !== existingId) {
          if (currentminutes >= startminutes && currentminutes <= endminutes) {
            isDuplicate = true;
            return isDuplicate;
            // break;
          }
        }
      }

    //   let paramsTeacher = {
    //   teacher: paramsDuplicate.teacher
    // }
    // const periodTeacherData = await Period.find(paramsTeacher).sort({ timeseq: 1 }).lean();
    // console.log("periodTeacherData", periodTeacherData);
    // for (const item of periodTeacherData) {
    //     const startminutes = toMinutes(item.starttime);
    //     const endminutes = toMinutes(item.endtime);
    //     const currentminutes = toMinutes(currenttime);
    //     if (item._id.toString() !== existingId) {
    //       if (currentminutes >= startminutes && currentminutes <= endminutes) {
    //         isDuplicate = true;
    //         return isDuplicate;
    //         // break;
    //       }
    //     }
    //   }




    }
  } catch (error) {
    console.log("Duplicate function", error.message);
  }
  return isDuplicate;
}



