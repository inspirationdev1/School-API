require("dotenv").config();
const mongoose = require("mongoose");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");
const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");
module.exports = {
  getAllReceipts: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allReceipt = await Receipt.find({ school: schoolId });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Receipt",
        data: allReceipt,
      });
    } catch (error) {
      console.log("Error in getAllReceipt", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Receipt. Try later",
      });
    }
  },
  getReceiptWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Receipt.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },

        {
          $lookup: {
            from: "receiptdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "receiptId",
            as: "receiptDetails",
          },
        },

        {
          $lookup: {
            from: "salesinvoices",
            localField: "receiptDetails.siId",
            foreignField: "_id",
            as: "salesInvoiceData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      siId: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$salesInvoiceData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.siId"],
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
            salesInvoiceData: 0, // cleanup
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "receiptDetails.student",
            foreignField: "_id",
            as: "studentData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      student: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$studentData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.student"],
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
            studentData: 0, // cleanup
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains receipt + receiptDetails[]
      });
    } catch (e) {
      console.error("Error in getReceiptWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Receipt",
      });
    }
  },
  createReceipt: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      //***Number seq */
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "receipt",
        schoolId: req.user.schoolId,
      });
      console.log("numberseqData.data", numberseqData);
      let seq = 1;
      let code = "";
      if (numberseqData) {
        seq = numberseqData.seq || 1;
        code = numberseqData.code || "";
      }
      //****** */

      // 2️⃣ Map receiptDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const recDetail = req.body.receiptDetails || [];
      let receiptDetails = recDetail.map((item) => ({
        ...item,
        school: schoolId,
        paymentMethod: paymentMethod,
      }));
      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(receiptDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Receipt not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      // 1️⃣ Save receipt
      const newReceipt = new Receipt({
        ...req.body,
        receiptCode: code,
        seq: seq,
        school: schoolId,
        acctrans: acctrans,
      });

      const savedData = await newReceipt.save();

      // 2️⃣ Map receiptDetails
      //   const recDetail = req.body.receiptDetails || [];
      const recId = savedData._id || null;
      receiptDetails = receiptDetails.map((item) => ({
        ...item,
        receiptId: recId,
      }));

      // 3️⃣ Save receiptDetails
      if (receiptDetails.length > 0) {
        await Receiptdetail.insertMany(receiptDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.receiptCode || "",
          doc_name: "receipt",
          doc_date: savedData?.receiptDate || "",
          doc_id: recId || "",
          school: savedData?.school || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "receipt",
        schoolId: req.user.schoolId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Receipt is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating receipt:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Receipt.",
      });
    }
  },
  updateReceiptWithId: async (req, res) => {
    // Not providing the  schoolId as receipt Id will be unique.
    try {
      const schoolId = req.user.schoolId;

      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map receiptDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const recDetail = req.body.receiptDetails || [];
      const recId = id || null;
      const receiptDetails = recDetail.map((item) => ({
        ...item,
        school: schoolId,
        receiptId: recId,
        paymentMethod: paymentMethod,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(receiptDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Receipt not Integrated",
          data: savedData,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      //   await Receipt.findOneAndUpdate({ _id: id }, { $set: { ...req.body, } });
      const savedData = await Receipt.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body, acctrans: acctrans } },
        { new: true, runValidators: true },
      );

      // 3️⃣ Save receipt details
      if (receiptDetails.length > 0) {
        const deleteDetail = await Receiptdetail.deleteMany({
          receiptId: recId,
          school: schoolId,
        });
        console.log(deleteDetail);

        await Receiptdetail.insertMany(receiptDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.receiptCode || "",
          doc_name: "receipt",
          doc_date: savedData?.receiptDate || "",
          doc_id: recId || "",
          school: savedData?.school || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }
      const ReceiptAfterUpdate = await Receipt.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Receipt Updated",
        data: ReceiptAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateReceiptWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Receipt. Try later",
      });
    }
  },
  deleteReceiptWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      await Receipt.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Receiptdetail.updateMany(
        { receiptId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Receipt.findOneAndDelete({ _id: id, school: schoolId });
      const ReceiptAfterDelete = await Receipt.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Receipt Deleted.",
        data: ReceiptAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateReceiptWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Receipt. Try later",
      });
    }
  },
  getReceiptPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Receipt.aggregate([
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
        {
          $lookup: {
            from: "receiptdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "receiptId",
            as: "receiptDetails",
          },
        },
        // 🔹 Populate Student
        {
          $lookup: {
            from: "students",
            localField: "receiptDetails.student",
            foreignField: "_id",
            as: "studentData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      student: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$studentData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.student"],
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
            studentData: 0, // cleanup
          },
        },
        // 🔹 Populate Parent
        {
          $lookup: {
            from: "parents",
            localField: "receiptDetails.parent",
            foreignField: "_id",
            as: "parentData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      parent: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$parentData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.parent"],
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
            parentData: 0, // cleanup
          },
        },
        // 🔹 Populate Class
        {
          $lookup: {
            from: "classes",
            localField: "receiptDetails.class",
            foreignField: "_id",
            as: "classData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      class: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$classData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.class"],
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
            classData: 0, // cleanup
          },
        },
        // 🔹 Populate Section
        {
          $lookup: {
            from: "sections",
            localField: "receiptDetails.section",
            foreignField: "_id",
            as: "sectionData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      section: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$sectionData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.section"],
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
            sectionData: 0, // cleanup
          },
        },
        // 🔹 Populate Sales Invoicedetail
        {
          $lookup: {
            from: "salesinvoicedetails", // collection name
            localField: "receiptDetails.siId",
            foreignField: "siId",
            as: "salesInvoiceData",
          },
        },
        {
          $addFields: {
            receiptDetails: {
              $map: {
                input: "$receiptDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      siId: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$salesInvoiceData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs.siId", "$$detail.siId"],
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
            salesInvoiceData: 0, // cleanup
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalinvAmount: {
              $sum: "$receiptDetails.invAmount",
            },
            totalpaidAmount: {
              $sum: "$receiptDetails.paidAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains receipt + receiptDetails[]
      });
    } catch (e) {
      console.error("Error in getReceiptPrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getReceiptPrint",
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
        screen: "receipt",
        paymentMethod: transDetails[0]?.paymentMethod,
      })
        .populate("accountledger")
        .lean();

      const studentTotals = Object.values(
        transDetails.reduce((acc, item) => {
          const studentId = item.student;

          if (!acc[studentId]) {
            acc[studentId] = {
              student: studentId,
              paidAmount: 0,
            };
          }

          acc[studentId].paidAmount += item.paidAmount || 0;

          return acc;
        }, {}),
      );

      console.log(studentTotals);

      const accountTransactions = [];

      let seq = 0;
      for (const stud of studentTotals) {
        const studentId = stud?.student || null;
        const paidAmount = stud?.paidAmount || 0;
        for (const item of accountsetupData) {
          if (item?.mapping_type === "net_amount" && paidAmount > 0) {
            seq++;
            accountTransactions.push({
              amount: paidAmount || 0,
              amount_type: item?.amount_type || "",
              mapping_type: item?.mapping_type || "",
              seq: seq,
              student: studentId || null,
              account_type: item?.accountledger?.account_type || "",
              accountledger: item?.accountledger?._id || null,
              accountledger_code: item?.accountledger?.accountledger_code || "",
              accountledger_name: item?.accountledger?.accountledger_name || "",
            });
          }
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
