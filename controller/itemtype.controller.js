require("dotenv").config();

const Itemtype = require("../model/itemtype.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {
  getAllItemtypes: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allItemtype = await Itemtype.find({ company: companyId }).populate(
        "taxrate",
      );
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Itemtype",
        data: allItemtype,
      });
    } catch (error) {
      console.log("Error in getAllItemtype", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Itemtype. Try later",
      });
    }
  },
  createItemtype: (req, res) => {
    const companyId = req.user.companyId;
    const newItemtype = new Itemtype({ ...req.body, company: companyId });
    newItemtype
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Itemtype is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res.status(500).json({ success: false, message: e.message });
      });
  },
  getItemtypeWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    Itemtype.findOne({ _id: id, company: companyId })
      .populate("taxrate")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Itemtype data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getItemtypeWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Itemtype Data" });
      });
  },

  updateItemtypeWithId: async (req, res) => {
    // Not providing the  companyId as itemtype Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Itemtype.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const ItemtypeAfterUpdate = await Itemtype.findOne({ _id: id }).populate(
        "taxrate",
      );
      res.status(200).json({
        success: true,
        message: "Itemtype Updated",
        data: ItemtypeAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateItemtypeWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Itemtype. Try later",
      });
    }
  },
  deleteItemtypeWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Itemtype.findOneAndDelete({ _id: id, company: companyId });
      const ItemtypeAfterDelete = await Itemtype.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Itemtype Deleted.",
        data: ItemtypeAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateItemtypeWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Itemtype. Try later",
      });
    }
  },
};
