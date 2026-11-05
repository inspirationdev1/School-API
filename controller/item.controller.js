require("dotenv").config();

const Item = require("../model/item.model");

module.exports = {
  getAllItems: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allItem = await Item.find({ company: companyId })
        .populate("itemtype")
        .populate("taxrate");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Item",
        data: allItem,
      });
    } catch (error) {
      console.log("Error in getAllItem", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Item. Try later",
      });
    }
  },
  createItem: (req, res) => {
    const companyId = req.user.companyId;
    const newItem = new Item({ ...req.body, company: companyId });
    newItem
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Item is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res.status(500).json({ success: false, message: e.message });
      });
  },
  getItemWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    Item.findOne({ _id: id, company: companyId })
      .populate("itemtype")
      .populate("taxrate")
      .populate("itemgroup")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Item data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getItemWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Item Data",
        });
      });
  },
  getItemWithQuery: async (req, res) => {
    const filterQuery = {};
    const companyId = req.user.companyId;
    console.log(companyId, "companyId");
    filterQuery["company"] = companyId;

    if (req.query.hasOwnProperty("itemtype")) {
      filterQuery["itemtype"] = req.query.itemtype;
    }

    Item.find(filterQuery)
      .populate("itemtype")
      .populate("taxrate")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Item data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getItemWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Item Data",
        });
      });
  },

  updateItemWithId: async (req, res) => {
    // Not providing the  companyId as item Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Item.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const ItemAfterUpdate = await Item.findOne({ _id: id })
        .populate("itemtype")
        .populate("taxrate");
      res.status(200).json({
        success: true,
        message: "Item Updated",
        data: ItemAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateItemWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Item. Try later",
      });
    }
  },
  deleteItemWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Item.findOneAndDelete({ _id: id, company: companyId });
      const ItemAfterDelete = await Item.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Item Deleted.",
        data: ItemAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateItemWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Item. Try later",
      });
    }
  },
};
