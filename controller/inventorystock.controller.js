const mongoose = require("mongoose");

const Item = require("../model/item.model");

const Openingstock = require("../model/openingstock.model");
const Openingstockdetail = require("../model/openingstockdetail.model");

const Purchaseinvoice = require("../model/purchaseinvoice.model");
const Purchaseinvoicedetail = require("../model/purchaseinvoicedetail.model");

const Stockissue = require("../model/stockissue.model");
const Stockissuedetail = require("../model/stockissuedetail.model");

const getSchoolId = (req) => req.user && req.user.schoolId;

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET VALID MASTER DOCUMENT IDS
const getValidMasterIds = async (Model, schoolId) => {
  const records = await Model.find({
    school: schoolId,
    status: "valid",
  })
    .select("_id")
    .lean();

  return records.map((record) => record._id);
};

// GET ITEM-WISE QUANTITY
const getGroupedQuantity = async (
  DetailModel,
  schoolId,
  masterField,
  masterIds,
  itemIds,
) => {
  if (!masterIds.length || !itemIds.length) {
    return {};
  }

  const records = await DetailModel.aggregate([
    {
      $match: {
        school: new mongoose.Types.ObjectId(schoolId),
        [masterField]: { $in: masterIds },
        item: { $in: itemIds },
        status: "valid",
      },
    },
    {
      $group: {
        _id: "$item",
        quantity: {
          $sum: "$quantity",
        },
      },
    },
  ]);

  return records.reduce((result, record) => {
    result[record._id.toString()] = record.quantity;
    return result;
  }, {});
};

// GET INVENTORY STOCK
exports.getInventoryStock = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    if (!schoolId || !validId(schoolId)) {
      return res.status(401).json({
        message: "Invalid school ID",
      });
    }

    const { search } = req.query;

    // FETCH ITEMS
    const itemFilter = {
      school: schoolId,
    };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");

      itemFilter.$or = [{ name: regex }, { code: regex }];
    }

    const items = await Item.find(itemFilter).sort({ name: 1 }).lean();

    if (!items.length) {
      return res.status(200).json([]);
    }

    const itemIds = items.map((item) => item._id);

    // FETCH VALID MASTER DOCUMENTS
    const [openingIds, purchaseIds, issueIds] = await Promise.all([
      getValidMasterIds(Openingstock, schoolId),
      getValidMasterIds(Purchaseinvoice, schoolId),
      getValidMasterIds(Stockissue, schoolId),
    ]);

    // CALCULATE ITEM-WISE QUANTITIES
    const [openingQty, purchaseQty, issuedQty] = await Promise.all([
      getGroupedQuantity(
        Openingstockdetail,
        schoolId,
        "osId",
        openingIds,
        itemIds,
      ),

      getGroupedQuantity(
        Purchaseinvoicedetail,
        schoolId,
        "piId",
        purchaseIds,
        itemIds,
      ),

      getGroupedQuantity(Stockissuedetail, schoolId, "siId", issueIds, itemIds),
    ]);

    // PREPARE INVENTORY STOCK RESULT
    const inventoryStock = items.map((item) => {
      const itemId = item._id.toString();

      const openingQuantity = openingQty[itemId] || 0;
      const purchasedQuantity = purchaseQty[itemId] || 0;
      const issuedQuantity = issuedQty[itemId] || 0;

      const closingQuantity =
        openingQuantity + purchasedQuantity - issuedQuantity;

      return {
        _id: item._id,
        itemId: item._id,
        itemCode: item.code || "",
        itemName: item.name,

        openingQuantity,
        purchasedQuantity,
        issuedQuantity,
        closingQuantity,

        purchasePrice: item.purchase_price || 0,
        salesPrice: item.sales_price || 0,
      };
    });

    return res.status(200).json(inventoryStock);
  } catch (error) {
    console.error("Get Inventory Stock Error:", error);

    return res.status(500).json({
      message: "Unable to fetch inventory stock",
      error: error.message,
    });
  }
};
