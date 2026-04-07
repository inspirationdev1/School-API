const Period = require('../model/period.model');

// Controller to create a period
exports.createPeriod = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;


    const newPeriod = new Period({ ...req.body, school: schoolId });

    await newPeriod.save();
    res.status(201).json({ message: 'Period assigned successfully', period: newPeriod });
  } catch (error) {
    res.status(500).json({ message: 'Error creating period', error });
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


    const id = req.params.id;
    

    updatedPeriod = await Period.findOneAndUpdate({_id:id},{$set:{...req.body}});
    res.status(200).json({ message: 'Period updated successfully', period: updatedPeriod });
  } catch (error) {
    res.status(500).json({ message: 'Error updating period', error });
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

exports.getPeriodWithQuery= async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['name'] = { $regex: req.query.search, $options: 'i' }
            }



            const filteredPeriods = await Period.find(filterQuery);
            res.status(200).json({ success: true, data: filteredPeriods })
        } catch (error) {
            console.log("Error in fetching Period with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Period  with query." })
        }

    };