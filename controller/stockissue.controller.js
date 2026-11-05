const mongoose = require("mongoose");

const Stockissue = require("../model/stockissue.model");
const Stockissuedetail = require("../model/stockissuedetail.model");

const Openingstock = require("../model/openingstock.model");
const Openingstockdetail = require("../model/openingstockdetail.model");

const Purchaseinvoice = require("../model/purchaseinvoice.model");
const Purchaseinvoicedetail = require("../model/purchaseinvoicedetail.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

const getSchoolId = (req) => req.user && req.user.schoolId;

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const getValidMasterIds = async (Model, schoolId, excludeId = null) => {
  const filter = {
    school: schoolId,
    status: "valid",
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const records = await Model.find(filter).select("_id").lean();

  return records.map((record) => record._id);
};

const getGroupedQuantity = async (
  DetailModel,
  schoolId,
  masterField,
  masterIds,
  itemIds,
) => {
  if (!masterIds.length || !itemIds.length) return {};

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
        quantity: { $sum: "$quantity" },
      },
    },
  ]);

  return records.reduce((result, record) => {
    result[record._id.toString()] = record.quantity;
    return result;
  }, {});
};

const getStockBalances = async (schoolId, itemIds, excludeIssueId = null) => {
  const [openingIds, purchaseIds, issueIds] = await Promise.all([
    getValidMasterIds(Openingstock, schoolId),
    getValidMasterIds(Purchaseinvoice, schoolId),
    getValidMasterIds(
      Stockissue,
      schoolId,
      excludeIssueId ? new mongoose.Types.ObjectId(excludeIssueId) : null,
    ),
  ]);

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

  const balances = {};

  itemIds.forEach((id) => {
    const key = id.toString();

    balances[key] =
      (openingQty[key] || 0) + (purchaseQty[key] || 0) - (issuedQty[key] || 0);
  });

  return balances;
};

const normalizeDetails = (details, schoolId) => {
  if (!Array.isArray(details) || details.length === 0) {
    throw new Error("At least one item is required");
  }

  const seen = new Set();

  return details.map((detail) => {
    if (!validId(detail.item)) {
      throw new Error("Invalid item selected");
    }

    const itemId = detail.item.toString();

    if (seen.has(itemId)) {
      throw new Error("Duplicate items are not allowed");
    }

    seen.add(itemId);

    const quantity = Number(detail.quantity);
    const purchasePrice = Number(detail.purchase_price || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Issue quantity must be greater than zero");
    }

    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
      throw new Error("Invalid purchase price");
    }

    return {
      school: schoolId,
      item: detail.item,
      item_name: detail.item_name || "",
      quantity,
      purchase_price: purchasePrice,
      grossAmount: quantity * purchasePrice,
      remarks: detail.remarks || "",
      status: "valid",
    };
  });
};

const validateStock = async (schoolId, details, excludeIssueId = null) => {
  const itemIds = details.map((detail) => detail.item);

  const balances = await getStockBalances(schoolId, itemIds, excludeIssueId);

  for (const detail of details) {
    const available = balances[detail.item.toString()] || 0;

    if (detail.quantity > available) {
      throw new Error(
        `Insufficient stock for ${detail.item_name || "selected item"}. Available: ${available}, Requested: ${detail.quantity}`,
      );
    }
  }
};

// CREATE STOCK ISSUE
exports.createStockissue = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    if (!schoolId) {
      return res.status(401).json({ message: "School not found" });
    }

    const { issueDate, employee, employee_name, remarks, issueDetails } =
      req.body;

    if (!validId(employee)) {
      return res.status(400).json({
        message: "Please select an employee",
      });
    }

    const details = normalizeDetails(issueDetails, schoolId);

    // await validateStock(schoolId, details);

    const sequence = await getNumberseqWithScreenId({
      screen_id: "stockissue",
      schoolId,
    });

    const seq = sequence?.seq || 1;
    const code = sequence?.code || "";

    const issue = new Stockissue({
      school: schoolId,
      siCode: `${code}${seq}`,
      seq,
      issueDate,
      employee,
      employee_name: employee_name || "",
      remarks: remarks || "",
      status: "valid",
      month: new Date(issueDate).getMonth() + 1,
      monthname: new Date(issueDate).toLocaleString("en", {
        month: "long",
      }),
      year: new Date(issueDate).getFullYear(),
    });

    await issue.save();

    try {
      await Stockissuedetail.insertMany(
        details.map((detail) => ({
          ...detail,
          siId: issue._id,
        })),
      );
    } catch (error) {
      await Stockissue.deleteOne({
        _id: issue._id,
        school: schoolId,
      });
      throw error;
    }

    await updateNumberseqWithScreenId({
      screen_id: "stockissue",
      schoolId,
    });

    return res.status(201).json({
      message: "Stock issue created successfully",
      data: issue,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// FETCH ALL STOCK ISSUES
exports.getAllStockissues = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    const records = await Stockissue.find({
      school: schoolId,
    })
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// FETCH STOCK ISSUE WITH ID
exports.getStockissueWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Stockissue.findOne({
      _id: id,
      school: schoolId,
    }).populate("employee");

    if (!issue) {
      return res.status(404).json({
        message: "Stock issue not found",
      });
    }

    const details = await Stockissuedetail.find({
      siId: issue._id,
      school: schoolId,
      status: "valid",
    }).populate("item");

    return res.status(200).json({
      ...issue.toObject(),
      issueDetails: details,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// FETCH STOCK ISSUES WITH QUERY
exports.getStockissueWithQuery = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { search, status } = req.query;

    const filter = {
      school: schoolId,
    };

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { siCode: { $regex: search, $options: "i" } },
        { employee_name: { $regex: search, $options: "i" } },
      ];
    }

    const records = await Stockissue.find(filter)
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE STOCK ISSUE
exports.updateStockissueWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Stockissue.findOne({
      _id: id,
      school: schoolId,
      status: "valid",
    });

    if (!issue) {
      return res.status(404).json({
        message: "Valid stock issue not found",
      });
    }

    const { issueDate, employee, employee_name, remarks, issueDetails } =
      req.body;

    if (!validId(employee)) {
      return res.status(400).json({
        message: "Please select an employee",
      });
    }

    const details = normalizeDetails(issueDetails, schoolId);

    // Exclude the existing issue while checking stock.
    // This effectively returns its old quantities before validating new quantities.
    // await validateStock(schoolId, details, issue._id);

    issue.issueDate = issueDate;
    issue.employee = employee;
    issue.employee_name = employee_name || "";
    issue.remarks = remarks || "";
    issue.month = new Date(issueDate).getMonth() + 1;
    issue.monthname = new Date(issueDate).toLocaleString("en", {
      month: "long",
    });
    issue.year = new Date(issueDate).getFullYear();

    await issue.save();

    await Stockissuedetail.deleteMany({
      siId: issue._id,
      school: schoolId,
    });

    await Stockissuedetail.insertMany(
      details.map((detail) => ({
        ...detail,
        siId: issue._id,
      })),
    );

    return res.status(200).json({
      message: "Stock issue updated successfully",
      data: issue,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// CANCEL STOCK ISSUE
exports.deleteStockissueWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Stockissue.findOne({
      _id: id,
      school: schoolId,
      status: "valid",
    });

    if (!issue) {
      return res.status(404).json({
        message: "Valid stock issue not found",
      });
    }

    issue.status = "cancel";
    await issue.save();

    await Stockissuedetail.updateMany(
      {
        siId: issue._id,
        school: schoolId,
      },
      {
        $set: { status: "cancel" },
      },
    );

    return res.status(200).json({
      message: "Stock issue cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET AVAILABLE STOCK FOR AN ITEM
exports.getStockAvailability = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { itemId } = req.params;
    const { excludeIssueId } = req.query;

    if (!validId(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    if (excludeIssueId && !validId(excludeIssueId)) {
      return res.status(400).json({
        message: "Invalid excluded issue ID",
      });
    }

    const balances = await getStockBalances(
      schoolId,
      [new mongoose.Types.ObjectId(itemId)],
      excludeIssueId || null,
    );

    return res.status(200).json({
      item: itemId,
      availableQuantity: Math.max(0, balances[itemId.toString()] || 0),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
