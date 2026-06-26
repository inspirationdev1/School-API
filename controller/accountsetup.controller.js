require("dotenv").config();
const mongoose = require("mongoose");

const Accountsetup = require("../model/accountsetup.model");
const Screen = require("../model/screen.model");

module.exports = {
  getAllAccountsetups: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allAccountsetup = await Accountsetup.find({
        school: schoolId,
      }).populate("accountledger");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Accountsetup",
        data: allAccountsetup,
      });
    } catch (error) {
      console.log("Error in getAllAccountsetup", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Accountsetup. Try later",
      });
    }
  },
  getAccountsetupWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      filterQuery["school"] = schoolId;

      if (req.query.search) {
        filterQuery.$or = [
          { screen_name: { $regex: req.query.search, $options: "i" } },
          { accountledger_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredAccountsetup =
        await Accountsetup.find(filterQuery).populate("accountledger");
      res.status(200).json({ success: true, data: filteredAccountsetup });
    } catch (error) {
      console.log("Error in fetching Accountsetup with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Accountsetup  with query.",
      });
    }
  },
  createAccountsetup: (req, res) => {
    const schoolId = req.user.schoolId;
    const newAccountsetup = new Accountsetup({ ...req.body, school: schoolId });
    newAccountsetup
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Accountsetup is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res.status(500).json({
          success: false,
          message: "Failed Creation of Accountsetup.",
        });
      });
  },
  getAccountsetupWithId: async (req, res) => {
    const id = req.params.id;
    const schoolId = req.user.schoolId;
    Accountsetup.findOne({ _id: id, school: schoolId })
      .populate("screen")
      .populate("accountledger")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Accountsetup data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getAccountsetupWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Accountsetup Data",
        });
      });
  },

  updateAccountsetupWithId: async (req, res) => {
    // Not providing the  schoolId as accountsetup Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Accountsetup.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
      );
      const AccountsetupAfterUpdate = await Accountsetup.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Accountsetup Updated",
        data: AccountsetupAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateAccountsetupWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Accountsetup. Try later",
      });
    }
  },
  deleteAccountsetupWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      await Accountsetup.findOneAndDelete({ _id: id, school: schoolId });
      const AccountsetupAfterDelete = await Accountsetup.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Accountsetup Deleted.",
        data: AccountsetupAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateAccountsetupWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Accountsetup. Try later",
      });
    }
  },
  getAccountsetupWithScreenId: async (req, res) => {
    const screen_id = req?.screen_id;
    const schoolId = req.schoolId;
    try {
      const accountsetupData = await Accountsetup.find({
        screen: screen_id,
        school: new mongoose.Types.ObjectId(schoolId),
      })
        .populate("screen")
        .lean();

      let seq = 0;
      let code = "";
      let prefix = "";
      let suffix = "";
      if (accountsetupData.length > 0) {
        seq = accountsetupData[0].seq || 0;
        prefix = accountsetupData[0].prefix || "";
        suffix = accountsetupData[0].suffix || "";
      }
      code = prefix + seq + suffix;
      const seqData = {
        seq: seq,
        code: code,
      };
      return seqData;
    } catch (error) {
      console.log("Error in getAccountsetupWithId", error.message);
      return { success: false, message: "Error in getting  Accountsetup Data" };
    }
  },
  updateAccountsetupWithScreenId: async (req, res) => {
    // Not providing the  schoolId as accountsetup Id will be unique.
    try {
      // let id = req.params.id;
      const screen_id = req?.screen_id;
      const schoolId = req?.schoolId;

      const accountSetupData = await Accountsetup.find({
        screen: screen_id,
        school: new mongoose.Types.ObjectId(schoolId),
      }).lean();

      let id = "";
      if (accountSetupData.length > 0) {
        let seq = accountSetupData[0].seq;
        seq += 1;
        accountSetupData[0].seq = seq;
        id = accountSetupData[0]._id || null;
        await Accountsetup.findOneAndUpdate(
          { _id: id },
          { $set: accountSetupData[0] },
        );
      }
      const accountsetupAfterUpdate = await Accountsetup.findOne({
        _id: id,
      }).lean();
      console.log("AccountsetupAfterUpdate", accountsetupAfterUpdate);
      return accountsetupAfterUpdate;

      // res.status(200).json({ success: true, message: "Accountsetup Updated", data: AccountsetupAfterUpdate })
    } catch (error) {
      console.log("Error in updateAccountsetupWithScreenId", error);
      return { success: false, message: error.message };
    }
  },
};
