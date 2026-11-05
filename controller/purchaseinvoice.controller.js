require("dotenv").config();
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const Purchaseinvoice = require("../model/purchaseinvoice.model");
const Purchaseinvoicedetail = require("../model/purchaseinvoicedetail.model");
const Supplier = require("../model/supplier.model");
const Taxrate = require("../model/taxrate.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const SupplierpaymentdetailModel = require("../model/supplierpaymentdetail.model");
const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

module.exports = {
  getAllPurchaseinvoices: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allPurchaseinvoice = await Purchaseinvoice.find({
        school: schoolId,
      })
        .populate("supplier")
        .populate("school");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Purchaseinvoice",
        data: allPurchaseinvoice,
      });
    } catch (error) {
      console.log("Error in getAllPurchaseinvoice", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Purchaseinvoice. Try later",
      });
    }
  },
  getPurchaseinvoiceWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Purchaseinvoice.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },

        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Purchaseinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getPurchaseinvoiceWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Purchaseinvoice",
      });
    }
  },
  createPurchaseinvoice: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      // Generate invoice number
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "purchaseinvoice",
        schoolId,
      });

      const seq = numberseqData?.seq || 1;
      const code = numberseqData?.code || "";

      // Normalize geolocation: empty string is not a valid ObjectId
      const geolocation =
        typeof req.body.geolocation === "string"
          ? req.body.geolocation.trim()
          : req.body.geolocation;

      const invoiceData = {
        ...req.body,
        geolocation: geolocation || undefined,
        piCode: code,
        seq,
        school: schoolId,
      };

      // Remove frontend-only fields from the invoice document
      delete invoiceData.invoiceDetails;

      // Map invoice details
      const piDetail = Array.isArray(req.body.invoiceDetails)
        ? req.body.invoiceDetails
        : [];

      const purchaseInvoiceDetails = piDetail.map((item) => ({
        ...item,
        school: schoolId,
      }));

      // Check accounting integration before saving
      const isDrCrEqual = await check_accounttransaction(
        purchaseInvoiceDetails,
      );

      if (!isDrCrEqual?.success) {
        return res.status(400).json({
          success: false,
          message:
            isDrCrEqual?.message ||
            "Purchase invoice accounting debit and credit totals do not match.",
        });
      }

      const acctrans = isDrCrEqual.accountTransactions || [];

      invoiceData.acctrans = acctrans;

      // Save purchase invoice
      const newPurchaseinvoice = new Purchaseinvoice(invoiceData);
      const savedData = await newPurchaseinvoice.save();

      const piId = savedData._id;

      // Save invoice details
      if (purchaseInvoiceDetails.length > 0) {
        const detailsToSave = purchaseInvoiceDetails.map((item) => ({
          ...item,
          piId,
        }));

        await Purchaseinvoicedetail.insertMany(detailsToSave);

        // Prepare accounting transactions
        const accountTransactionsToSave = acctrans.map((item) => ({
          ...item,
          doc_code: savedData.piCode || "",
          doc_name: "purchaseinvoice",
          doc_date: savedData.invoiceDate || "",
          doc_id: piId,
          supplier: savedData.supplier || null,
          school: savedData.school || null,
        }));

        await integrate_accounttransaction(accountTransactionsToSave);
      }

      // Update invoice sequence after successful creation
      await updateNumberseqWithScreenId({
        screen_id: "purchaseinvoice",
        schoolId,
      });

      return res.status(201).json({
        success: true,
        data: savedData,
        message: "Purchase invoice created successfully.",
      });
    } catch (error) {
      console.error("Error creating purchase invoice:", error);

      return res.status(500).json({
        success: false,
        message: `Failed Creation of Purchaseinvoice. ${error.message}`,
      });
    }
  },
  updatePurchaseinvoiceWithId: async (req, res) => {
    // Not providing the  schoolId as purchaseinvoice Id will be unique.
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map invoice details
      const piDetail = req.body.invoiceDetails || [];
      const piId = id || null;
      const purchaseInvoiceDetails = piDetail.map((item) => ({
        ...item,
        school: schoolId,
        piId: piId,
        supplier: req.body?.supplier || null,
      }));

      // 3️⃣ Save invoice details
      if (purchaseInvoiceDetails.length > 0) {
        // *****Start Check Accounts Integration******
        const isDrCrEqual = await check_accounttransaction(
          purchaseInvoiceDetails,
        );
        if (!isDrCrEqual) {
          res.status(200).json({
            success: false,
            message: "Purchaseinvoice not Integrated",
            data: req?.body,
          });
        }

        let acctrans = isDrCrEqual?.accountTransactions || [];
        // *****End Check Accounts Integration******

        // const geolocation =
        // typeof req.body?.geolocation === "object"
        //   ? String(req.body?.geolocation?._id || "")
        //   : String(req.body?.geolocation || "");

        const savedData = await Purchaseinvoice.findOneAndUpdate(
          { _id: id },
          {
            $set: { ...req.body, acctrans: acctrans },
          },
          { new: true, runValidators: true },
        );

        await Purchaseinvoicedetail.deleteMany({
          piId: piId,
          school: schoolId,
        });

        await Purchaseinvoicedetail.insertMany(purchaseInvoiceDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.piCode || "",
          doc_name: "purchaseinvoice",
          doc_date: savedData?.invoiceDate || "",
          doc_id: piId || "",
          supplier: savedData?.supplier || null,
          school: savedData?.school || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******

        const PurchaseinvoiceAfterUpdate = await Purchaseinvoice.findOne({
          _id: id,
        });
        res.status(200).json({
          success: true,
          isIntegrated: isIntegrated?.success || false,
          message: "Purchaseinvoice Updated",
          data: PurchaseinvoiceAfterUpdate,
        });
      }
    } catch (error) {
      console.log("Error in updatePurchaseinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Purchaseinvoice. Try later",
      });
    }
  },
  deletePurchaseinvoiceWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      const paymentDetails = await SupplierpaymentdetailModel.find({
        piId: id,
        status: "valid",
      }).lean();
      if (paymentDetails.length > 0) {
        res.status(500).json({
          success: false,
          message: "Cannot Delete Invoice, Receipt is against this invoice",
        });
        return;
      }

      await Purchaseinvoice.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Purchaseinvoicedetail.updateMany(
        { piId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Purchaseinvoice.findOneAndDelete({ _id: id, school: schoolId });
      const PurchaseinvoiceAfterDelete = await Purchaseinvoice.findOne({
        _id: id,
      });
      res.status(200).json({
        success: true,
        message: "Purchaseinvoice Deleted.",
        data: PurchaseinvoiceAfterDelete,
      });
    } catch (error) {
      console.log("Error in updatePurchaseinvoiceWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Purchaseinvoice. Try later",
      });
    }
  },
  getPurchaseinvoicePrint: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Purchaseinvoice.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },
        // 🔹 Populate school
        {
          $lookup: {
            from: "schools", // collection name
            localField: "school",
            foreignField: "_id",
            as: "school",
          },
        },
        {
          $unwind: "$school", // convert array → object
        },

        // 🔹 Populate Geolocation
        {
          $lookup: {
            from: "geolocations",
            localField: "geolocation",
            foreignField: "_id",
            as: "geolocation",
          },
        },
        {
          $unwind: {
            path: "$geolocation",
            preserveNullAndEmptyArrays: true,
          },
        },
        // 🔹 Populate Supplier
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
        {
          $lookup: {
            from: "feestructures",
            localField: "invoiceDetails.feestructure",
            foreignField: "_id",
            as: "feeStructureData",
          },
        },
        {
          $addFields: {
            invoiceDetails: {
              $map: {
                input: "$invoiceDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      feestructure: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$feeStructureData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.feestructure"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            feeStructureData: 0, // cleanup
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$invoiceDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$invoiceDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$invoiceDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Purchaseinvoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getPurchaseinvoicePrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getPurchaseinvoicePrint",
      });
    }
  },
  getPurchaseinvoiceWithSupplierId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const filterQuery = {};
      filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);

      if (req.query.hasOwnProperty("supplier")) {
        const supplierId = req.query.supplier;
        filterQuery["supplier"] = new mongoose.Types.ObjectId(supplierId);
      }
      filterQuery["status"] = "valid";

      var result = await Purchaseinvoice.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "purchaseinvoicedetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "piId",
            as: "invoiceDetails",
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$invoiceDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$invoiceDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$invoiceDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Purchaseinvoice not found",
        });
      }

      if (result.length > 0) {
        const paymentDetails = await SupplierpaymentdetailModel.aggregate([
          { $match: filterQuery },
          {
            $group: {
              _id: "$piId",
              piCode: { $first: "$piCode" },
              totalPaidAmount: { $sum: "$paidAmount" },
              paymentDetails: { $push: "$$ROOT" },
            },
          },
        ]);
        if (paymentDetails.length > 0) {
          console.log("paymentDetails:", paymentDetails);
          for (const item of result) {
            console.log("PI ID:", item._id);
            console.log("Invoice Code:", item.piCode);
            const piId = item._id;
            const filtered = paymentDetails.filter(
              (row) => row._id.toString() === piId.toString(),
            );
            console.log("filtered:", filtered);
            if (filtered.length > 0) {
              item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
            } else {
              item.totalPaidAmount = 0;
            }
            item.balanceAmount = item.totalNetAmount - item.totalPaidAmount;
          }
          result = result.filter((row) => row.balanceAmount > 0);
          console.log("result:", result);
        }
      }

      res.status(200).json({
        success: true,
        data: result, // contains invoice + invoiceDetails[]
      });
    } catch (e) {
      console.error("Error in getPurchaseinvoiceWithSupplierId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Purchaseinvoice",
      });
    }
  },

  getPurchaseinvoiceWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;

      filterQuery["school"] = schoolId;
      if (req.query.search) {
        filterQuery.$or = [
          { piCode: { $regex: req.query.search, $options: "i" } },
          { supplier_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredPurchaseinvoices = await Purchaseinvoice.find(filterQuery)
        .populate("supplier")
        .populate("geolocation")
        .populate("school");
      res.status(200).json({ success: true, data: filteredPurchaseinvoices });
    } catch (error) {
      console.log("Error in fetching Supplier with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Purchaseinvoice  with query.",
      });
    }
  },
};

const check_accounttransaction = async (transDetails) => {
  try {
    // 3️⃣ Save Accounttransactions
    if (transDetails.length > 0) {
      const accountsetupData = await Accountsetup.find({
        school: transDetails[0]?.school,
        screen: "purchaseinvoice",
      })
        .populate("accountledger")
        .lean();

      const totals = transDetails.reduce(
        (acc, item) => {
          acc.grossAmount += item.grossAmount || 0;
          acc.discountAmount += item.discountAmount || 0;
          acc.taxable_amount += item.taxable_amount || 0;
          acc.tax_amount += item.tax_amount || 0;
          acc.netAmount += item.netAmount || 0;

          return acc;
        },
        {
          grossAmount: 0,
          discountAmount: 0,
          taxable_amount: 0,
          tax_amount: 0,
          netAmount: 0,
        },
      );

      const accountTransactions = [];

      const taxCount = accountsetupData.filter(
        (item) => item.mapping_type === "tax_amount",
      ).length;
      let seq = 0;
      for (const item of accountsetupData) {
        if (item?.mapping_type === "net_amount" && totals?.netAmount > 0) {
          seq++;
          accountTransactions.push({
            amount: totals?.netAmount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        } else if (
          item?.mapping_type === "taxable_amount" &&
          totals?.taxable_amount > 0
        ) {
          seq++;
          accountTransactions.push({
            amount: totals?.taxable_amount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        } else if (
          item?.mapping_type === "tax_amount" &&
          totals?.tax_amount > 0
        ) {
          let tax_amount = totals?.tax_amount || 0;
          if (taxCount > 1) {
            tax_amount = (totals?.tax_amount || 0) / taxCount;
          }

          seq++;
          accountTransactions.push({
            amount: tax_amount || 0,
            amount_type: item?.amount_type || "",
            mapping_type: item?.mapping_type || "",
            seq: seq,
            account_type: item?.accountledger?.account_type || "",
            accountledger: item?.accountledger?._id || null,
            accountledger_code: item?.accountledger?.accountledger_code || "",
            accountledger_name: item?.accountledger?.accountledger_name || "",
          });
        }
      }

      const totals_DR_CR = accountTransactions.reduce(
        (acc, item) => {
          if (item.amount_type === "dr") {
            acc.totalDebit += item.amount || 0;
          }

          if (item.amount_type === "cr") {
            acc.totalCredit += item.amount || 0;
          }

          return acc;
        },
        {
          totalDebit: 0,
          totalCredit: 0,
        },
      );

      console.log("Total Debit:", totals_DR_CR.totalDebit);
      console.log("Total Credit:", totals_DR_CR.totalCredit);
      if (totals_DR_CR.totalDebit === totals_DR_CR.totalCredit) {
        return {
          message: "Accounts Transaction saved Successfully",
          totalDebit: totals_DR_CR.totalDebit,
          totalCredit: totals_DR_CR.totalCredit,
          accountTransactions: accountTransactions,
          success: true,
        };
      } else {
        return {
          message:
            "Accounts Transaction Not saved, check Total Debit = " +
            totals_DR_CR.totalDebit +
            " And Total Credit = " +
            totals_DR_CR.totalCredit,
          totalDebit: totals_DR_CR.totalDebit,
          totalCredit: totals_DR_CR.totalCredit,
          accountTransactions: accountTransactions,
          success: false,
        };
      }
    }
  } catch (error) {
    return {
      message: error.message,
      totalDebit: totals_DR_CR.totalDebit,
      totalCredit: totals_DR_CR.totalCredit,
      accountTransactions: [],
      success: false,
    };
  }
};

const integrate_accounttransaction = async (accountTransactions) => {
  try {
    // 3️⃣ Save Accounttransactions
    if (accountTransactions.length > 0) {
      const deletData = await Accounttransaction.deleteMany({
        doc_id: accountTransactions[0]?.doc_id,
        school: accountTransactions[0]?.school,
      });
      console.log("deletData", deletData);

      await Accounttransaction.insertMany(accountTransactions);
      return { message: "Integration successfull", success: true };
    }
  } catch (error) {
    return { message: error.message, success: false };
  }
};
