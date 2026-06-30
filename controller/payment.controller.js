require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("../model/payment.model");
const Paymentdetail = require("../model/paymentdetail.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getAllPayments: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allPayment = await Payment.find({ school: schoolId });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Payment",
        data: allPayment,
      });
    } catch (error) {
      console.log("Error in getAllPayment", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Payment. Try later",
      });
    }
  },
  getPaymentWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Payment.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },

        {
          $lookup: {
            from: "paymentdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "paymentId",
            as: "paymentDetails",
          },
        },

        {
          $lookup: {
            from: "expenses",
            localField: "paymentDetails.expenseId",
            foreignField: "_id",
            as: "expenseData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      expenseId: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$expenseData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.expenseId"],
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
            expenseData: 0, // cleanup
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "paymentDetails.employee",
            foreignField: "_id",
            as: "employeeData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      employee: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$employeeData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.employee"],
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
            employeeData: 0, // cleanup
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains payment + paymentDetails[]
      });
    } catch (e) {
      console.error("Error in getPaymentWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Payment",
      });
    }
  },
  createPayment: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      //***Number seq */
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "payment",
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

      // 2️⃣ Map paymentDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const payDetail = req.body.paymentDetails || [];
      let paymentDetails = payDetail.map((item) => ({
        ...item,
        school: schoolId,
        paymentMethod: paymentMethod,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(paymentDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Payment not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      // 1️⃣ Save payment
      const newPayment = new Payment({
        ...req.body,
        paymentCode: code,
        seq: seq,
        school: schoolId,
        acctrans: acctrans,
      });

      const savedData = await newPayment.save();

      // 2️⃣ Map paymentDetails
      //   const payDetail = req.body.paymentDetails || [];
      const payId = savedData._id || null;
      paymentDetails = paymentDetails.map((item) => ({
        ...item,
        school: schoolId,
        paymentId: payId,
      }));

      // 3️⃣ Save paymentDetails
      if (paymentDetails.length > 0) {
        await Paymentdetail.insertMany(paymentDetails);

        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.paymentCode || "",
          doc_name: "payment",
          doc_date: savedData?.paymentDate || "",
          doc_id: payId || "",
          school: savedData?.school || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }

      // ****Update Number Seq****
      const numberseqAfterUpdate = await updateNumberseqWithScreenId({
        screen_id: "payment",
        schoolId: req.user.schoolId,
      });
      console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      // *********************

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Payment is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating payment:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Payment.",
      });
    }
  },
  updatePaymentWithId: async (req, res) => {
    // Not providing the  schoolId as payment Id will be unique.
    try {
      const schoolId = req.user.schoolId;

      let id = req.params.id;
      console.log(req.body);

      // 2️⃣ Map paymentDetails
      const paymentMethod = req.body?.paymentMethod || "";
      const payDetail = req.body.paymentDetails || [];
      const payId = id || null;
      const paymentDetails = payDetail.map((item) => ({
        ...item,
        school: schoolId,
        paymentId: payId,
        paymentMethod: paymentMethod,
      }));

      // *****Start Check Accounts Integration******
      const isDrCrEqual = await check_accounttransaction(paymentDetails);
      if (!isDrCrEqual) {
        res.status(200).json({
          success: false,
          message: "Payment not Integrated",
          data: req?.body,
        });
      }

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      const savedData = await Payment.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body, acctrans: acctrans } },
        { new: true, runValidators: true },
      );

      // 3️⃣ Save payment details
      if (paymentDetails.length > 0) {
        await Paymentdetail.deleteMany({
          paymentId: payId,
          school: schoolId,
        });

        await Paymentdetail.insertMany(paymentDetails);
        // *****Start Insert Accounts Integration******
        acctrans = isDrCrEqual?.accountTransactions.map((item) => ({
          ...item,
          doc_code: savedData?.paymentCode || "",
          doc_name: "payment",
          doc_date: savedData?.paymentDate || "",
          doc_id: payId || "",
          school: savedData?.school || null,
        }));
        const isIntegrated = await integrate_accounttransaction(acctrans || []);
        // *****End Insert Accounts Integration******
      }
      const PaymentAfterUpdate = await Payment.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Payment Updated",
        data: PaymentAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updatePaymentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Payment. Try later",
      });
    }
  },
  deletePaymentWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      await Payment.findOneAndUpdate(
        { _id: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      await Paymentdetail.updateMany(
        { paymentId: id },
        { $set: { status: "cancel" } },
        { new: true }, // optional: returns updated document
      );
      // await Payment.findOneAndDelete({ _id: id, school: schoolId });
      const PaymentAfterDelete = await Payment.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Payment Deleted.",
        data: PaymentAfterDelete,
      });
    } catch (error) {
      console.log("Error in updatePaymentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Payment. Try later",
      });
    }
  },
  getPaymentPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Payment.aggregate([
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
            from: "paymentdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "paymentId",
            as: "paymentDetails",
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "paymentDetails.employee",
            foreignField: "_id",
            as: "employeeData",
          },
        },
        {
          $addFields: {
            paymentDetails: {
              $map: {
                input: "$paymentDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      employee: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$employeeData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.employee"],
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
            employeeData: 0, // cleanup
          },
        },

        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalexpenseAmount: {
              $sum: "$paymentDetails.expenseAmount",
            },
            totalpaidAmount: {
              $sum: "$paymentDetails.paidAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains payment + paymentDetails[]
      });
    } catch (e) {
      console.error("Error in getPaymentPrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getPaymentPrint",
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
        screen: "payment",
        paymentMethod: transDetails[0]?.paymentMethod,
      })
        .populate("accountledger")
        .lean();

      const employeeTotals = Object.values(
        transDetails.reduce((acc, item) => {
          const employeeId = item.employee;

          if (!acc[employeeId]) {
            acc[employeeId] = {
              employee: employeeId,
              paidAmount: 0,
            };
          }

          acc[employeeId].paidAmount += item.paidAmount || 0;

          return acc;
        }, {}),
      );

      console.log(employeeTotals);

      const accountTransactions = [];

      let seq = 0;
      for (const emp of employeeTotals) {
        const employeeId = emp?.employee || null;
        const paidAmount = emp?.paidAmount || 0;
        for (const item of accountsetupData) {
          if (item?.mapping_type === "net_amount" && paidAmount > 0) {
            seq++;
            accountTransactions.push({
              amount: paidAmount || 0,
              amount_type: item?.amount_type || "",
              mapping_type: item?.mapping_type || "",
              seq: seq,
              employee: employeeId || null,
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
