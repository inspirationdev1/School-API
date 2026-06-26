require("dotenv").config();

const Expensetype = require("../model/expensetype.model");
module.exports = {
  getAllExpensetypes: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allExpensetype = await Expensetype.find({
        school: schoolId,
      }).populate("taxrate");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Expensetype",
        data: allExpensetype,
      });
    } catch (error) {
      console.log("Error in getAllExpensetype", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Expensetype. Try later",
      });
    }
  },
  createExpensetype: (req, res) => {
    const schoolId = req.user.schoolId;
    const newExpensetype = new Expensetype({ ...req.body, school: schoolId });
    newExpensetype
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Expensetype is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Creation of Expensetype." });
      });
  },
  getExpensetypeWithId: async (req, res) => {
    const id = req.params.id;
    const schoolId = req.user.schoolId;
    Expensetype.findOne({ _id: id, school: schoolId })
      .populate("taxrate")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Expensetype data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getExpensetypeWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Expensetype Data",
        });
      });
  },

  updateExpensetypeWithId: async (req, res) => {
    // Not providing the  schoolId as expensetype Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Expensetype.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
      );
      const ExpensetypeAfterUpdate = await Expensetype.findOne({
        _id: id,
      }).populate("taxrate");
      res.status(200).json({
        success: true,
        message: "Expensetype Updated",
        data: ExpensetypeAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateExpensetypeWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Expensetype. Try later",
      });
    }
  },
  deleteExpensetypeWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      await Expensetype.findOneAndDelete({ _id: id, school: schoolId });
      const ExpensetypeAfterDelete = await Expensetype.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Expensetype Deleted.",
        data: ExpensetypeAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateExpensetypeWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Expensetype. Try later",
      });
    }
  },
  getExpensetypeWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      console.log(schoolId, "schoolId");
      filterQuery["school"] = schoolId;
      if (req.query.hasOwnProperty("search")) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      if (req.query.hasOwnProperty("_id")) {
        filterQuery["_id"] = req.query._id;
      }

      const filteredExpensetypes = await Expensetype.find(filterQuery);
      res.status(200).json({ success: true, data: filteredExpensetypes });
    } catch (error) {
      console.log("Error in fetching Expensetype with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Expensetype  with query.",
      });
    }
  },
};
