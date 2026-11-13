const mongoose = require("mongoose");

const Openingstock = require("../model/openingstock.model");
const Openingstockdetail = require("../model/openingstockdetail.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const getSchoolId = (req) => req.user && req.user.schoolId;

// --------------------------------------------------
// NORMALIZE ITEM DETAILS
// --------------------------------------------------

function normalizeDetails(details, schoolId, osId) {
  if (!Array.isArray(details)) return [];

  return details.map((row) => ({
    school: schoolId,
    osId,
    item: row.item?._id || row.item,
    item_name: row.item_name || row.item?.item?.name || row.item?.name || "",
    quantity: Number(row.quantity),
    purchase_price: Number(row.purchase_price || 0),
    grossAmount: Number(
      row.grossAmount ?? Number(row.quantity) * Number(row.purchase_price || 0),
    ),
    remarks: row.remarks || "",
    status: "valid",
  }));
}

// --------------------------------------------------
// VALIDATE ITEM DETAILS
// --------------------------------------------------

function validateDetails(details) {
  if (!details.length) {
    return "At least one item is required.";
  }

  const itemIds = [];

  for (const row of details) {
    if (!validId(String(row.item || ""))) {
      return "Select a valid item for every row.";
    }

    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      return "Quantity must be greater than zero.";
    }

    if (!Number.isFinite(row.purchase_price) || row.purchase_price < 0) {
      return "Rate must be zero or greater.";
    }

    if (!Number.isFinite(row.grossAmount) || row.grossAmount < 0) {
      return "Amount must be zero or greater.";
    }

    itemIds.push(String(row.item));
  }

  if (new Set(itemIds).size !== itemIds.length) {
    return "An item cannot be repeated in the same Opening Stock entry.";
  }

  return null;
}

// --------------------------------------------------
// VALIDATE WAREHOUSE
// --------------------------------------------------

function validateWarehouse(warehouse) {
  if (!warehouse || !validId(warehouse)) {
    return false;
  }

  return true;
}

// --------------------------------------------------
// CREATE OPENING STOCK
// --------------------------------------------------

exports.createOpeningstock = async (req, res) => {
  let savedMaster;

  try {
    const schoolId = getSchoolId(req);

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    const {
      openingStockDate,
      warehouse,
      warehouse_name,
      remarks,
      invoiceDetails,
    } = req.body;

    if (!validateWarehouse(warehouse)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid warehouse.",
      });
    }

    const details = normalizeDetails(invoiceDetails, schoolId, null);

    const validationError = validateDetails(details);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const date = openingStockDate || req.body.invoiceDate;

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid Opening Stock date is required.",
      });
    }

    const numberseqData = await getNumberseqWithScreenId({
      screen_id: "openingstock",
      schoolId,
    });

    const seq = numberseqData?.seq || 1;

    savedMaster = await Openingstock.create({
      school: schoolId,
      osCode: numberseqData?.code || `OS-${seq}`,
      seq,
      openingStockDate: new Date(date),

      warehouse,
      warehouse_name: warehouse_name || "",

      remarks: remarks || "",
      status: "valid",
      month: Number(req.body.month || new Date(date).getMonth() + 1),
      monthname:
        req.body.monthname ||
        new Date(date).toLocaleString("en", {
          month: "long",
        }),
      year: Number(req.body.year || new Date(date).getFullYear()),
    });

    await Openingstockdetail.insertMany(
      details.map((row) => ({
        ...row,
        osId: savedMaster._id,
      })),
    );

    await updateNumberseqWithScreenId({
      screen_id: "openingstock",
      schoolId,
    });

    return res.status(201).json({
      success: true,
      data: savedMaster,
      message: "Opening Stock created successfully.",
    });
  } catch (error) {
    console.error("createOpeningstock:", error);

    if (savedMaster?._id) {
      await Promise.allSettled([
        Openingstockdetail.deleteMany({
          osId: savedMaster._id,
          school: getSchoolId(req),
        }),
        Openingstock.deleteOne({
          _id: savedMaster._id,
          school: getSchoolId(req),
        }),
      ]);
    }

    return res.status(500).json({
      success: false,
      message: `Failed to create Opening Stock. ${error.message}`,
    });
  }
};

// --------------------------------------------------
// FETCH ALL OPENING STOCKS
// --------------------------------------------------

exports.getAllOpeningstocks = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    const data = await Openingstock.find({
      school: schoolId,
    })
      .populate("warehouse")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllOpeningstocks:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Opening Stock records.",
    });
  }
};

// --------------------------------------------------
// FETCH OPENING STOCK WITH ID
// --------------------------------------------------

exports.getOpeningstockWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Opening Stock ID.",
      });
    }

    const master = await Openingstock.findOne({
      _id: id,
      school: schoolId,
    })
      .populate("warehouse")
      .lean();

    if (!master) {
      return res.status(404).json({
        success: false,
        message: "Opening Stock record not found.",
      });
    }

    const invoiceDetails = await Openingstockdetail.find({
      osId: id,
      school: schoolId,
      status: "valid",
    })
      .populate("item")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...master,
        invoiceDetails,
      },
    });
  } catch (error) {
    console.error("getOpeningstockWithId:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Opening Stock record.",
    });
  }
};

// --------------------------------------------------
// FETCH OPENING STOCK WITH QUERY
// --------------------------------------------------

exports.getOpeningstockWithQuery = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    const filter = {
      school: schoolId,
    };

    if (req.query.search) {
      const search = String(req.query.search);

      filter.$or = [
        { osCode: { $regex: search, $options: "i" } },
        { warehouse_name: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const data = await Openingstock.find(filter)
      .populate("warehouse")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getOpeningstockWithQuery:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search Opening Stock records.",
    });
  }
};

// --------------------------------------------------
// UPDATE OPENING STOCK
// --------------------------------------------------

exports.updateOpeningstockWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Opening Stock ID.",
      });
    }

    const current = await Openingstock.findOne({
      _id: id,
      school: schoolId,
      status: "valid",
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Opening Stock record not found or cancelled.",
      });
    }

    const { warehouse, warehouse_name, remarks } = req.body;

    if (!validateWarehouse(warehouse)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid warehouse.",
      });
    }

    const details = normalizeDetails(req.body.invoiceDetails, schoolId, id);

    const validationError = validateDetails(details);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const date =
      req.body.openingStockDate ||
      req.body.invoiceDate ||
      current.openingStockDate;

    if (Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid Opening Stock date is required.",
      });
    }

    await Openingstock.updateOne(
      {
        _id: id,
        school: schoolId,
      },
      {
        $set: {
          openingStockDate: new Date(date),

          warehouse,
          warehouse_name: warehouse_name || "",

          remarks: remarks ?? current.remarks,

          month: Number(req.body.month || new Date(date).getMonth() + 1),
          monthname:
            req.body.monthname ||
            new Date(date).toLocaleString("en", {
              month: "long",
            }),
          year: Number(req.body.year || new Date(date).getFullYear()),
        },
      },
    );

    await Openingstockdetail.deleteMany({
      osId: id,
      school: schoolId,
    });

    await Openingstockdetail.insertMany(details);

    const data = await Openingstock.findOne({
      _id: id,
      school: schoolId,
    })
      .populate("warehouse")
      .lean();

    return res.status(200).json({
      success: true,
      data,
      message: "Opening Stock updated successfully.",
    });
  } catch (error) {
    console.error("updateOpeningstockWithId:", error);

    return res.status(500).json({
      success: false,
      message: `Unable to update Opening Stock. ${error.message}`,
    });
  }
};

// --------------------------------------------------
// CANCEL OPENING STOCK
// --------------------------------------------------

exports.deleteOpeningstockWithId = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School context is missing.",
      });
    }

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Opening Stock ID.",
      });
    }

    const updated = await Openingstock.findOneAndUpdate(
      {
        _id: id,
        school: schoolId,
        status: "valid",
      },
      {
        $set: {
          status: "cancel",
        },
      },
      {
        new: true,
      },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Opening Stock record not found or already cancelled.",
      });
    }

    await Openingstockdetail.updateMany(
      {
        osId: id,
        school: schoolId,
      },
      {
        $set: {
          status: "cancel",
        },
      },
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Opening Stock cancelled successfully.",
    });
  } catch (error) {
    console.error("deleteOpeningstockWithId:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel Opening Stock.",
    });
  }
};
