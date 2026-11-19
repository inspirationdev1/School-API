require("dotenv").config();
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const zlib = require("zlib");

const Accounttransaction = require("../model/accounttransaction.model");
const Accountsetup = require("../model/accountsetup.model");
const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");
const appsetting = require("../model/appsetting.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");

const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const algorithm = "aes-256-gcm";

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const { stringify } = require("querystring");

dayjs.extend(utc);

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");
module.exports = {
  getAllReceipts: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allReceipt = await Receipt.find({ school: schoolId }).sort({
        _id: -1,
      });
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
      const schoolId = req.body.school;

      //***Number seq */
      const numberseqData = await getNumberseqWithScreenId({
        screen_id: "receipt",
        schoolId: schoolId,
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
        order_id: req.body?.order_id ?? null,
        payment_id: req.body?.payment_id ?? null,
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

      const totals = receiptDetails.reduce(
        (acc, item) => {
          acc.paidAmount += item.paidAmount || 0;

          return acc;
        },
        {
          paidAmount: 0,
        },
      );

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      //****Start Razor Integration */

      //****End Razor Integration*/

      // 1️⃣ Save receipt
      const newReceipt = new Receipt({
        ...req.body,
        receiptCode: code,
        seq: seq,
        school: schoolId,
        paidAmount: totals?.paidAmount,
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
        schoolId: schoolId,
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

      const totals = receiptDetails.reduce(
        (acc, item) => {
          acc.paidAmount += item.paidAmount || 0;

          return acc;
        },
        {
          paidAmount: 0,
        },
      );

      let acctrans = isDrCrEqual?.accountTransactions || [];
      // *****End Check Accounts Integration******

      //   await Receipt.findOneAndUpdate({ _id: id }, { $set: { ...req.body, } });
      const savedData = await Receipt.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            ...req.body,
            paidAmount: totals?.paidAmount,
            acctrans: acctrans,
          },
        },
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
  razorOrder: async (req, res) => {
    try {
      const recDetails = req.body.receiptDetails || [];
      const schoolId = recDetails[0].school || "";

      const receiptNumber = req.body.receiptNumber || "RCT-001";
      const receiptData = await Receipt.find({
        school: schoolId,
        receiptNumber: receiptNumber,
      }).lean();
      if (receiptData.length > 0) {
        return res.status(404).json({
          success: false,
          message: "Payment already Done, Cannot Duplicate",
        });
      }

      // Get Razorpay credentials
      const appsettingData = await appsetting
        .findOne({ school: schoolId })
        .lean();

      if (!appsettingData) {
        return res.status(404).json({
          success: false,
          message: "Razorpay credentials not available",
        });
      }

      const RAZORPAY_KEY_ID = appsettingData.RAZORPAY_KEY_ID;

      const RAZORPAY_SECRET = appsettingData.RAZORPAY_SECRET;

      if (!RAZORPAY_KEY_ID || !RAZORPAY_SECRET) {
        return res.status(500).json({
          success: false,
          message: "Razorpay Key ID or Secret is missing",
        });
      }

      // Receive amount in RUPEES from React
      const paidAmount = Number(req.body.paidAmount);
      const method = req.body?.method ?? "upi";
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount",
        });
      }

      // Convert RUPEES into PAISE
      const amountInPaise = Math.round(paidAmount * 100);

      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_SECRET,
      });

      const options = {
        amount: amountInPaise,
        currency: "INR",
        method: method,
        receipt: req.body.receiptNumber || "RCT-001",
      };

      const order = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        data: {
          ...order,
          RAZORPAY_KEY_ID,
          currency: "INR",
          name: recDetails[0].school_name, //your business name
          description: "Fees Pay Transaction",
          image: recDetails[0].school_url,
        },
      });
    } catch (e) {
      console.error("Error in razorOrder:", e);

      return res.status(500).json({
        success: false,
        message: e.message || "Error creating Razorpay order",
      });
    }
  },

  razorValidate: async (req, res) => {
    try {
      const schoolId = req.body.school;

      const appsettingData = await appsetting.find({ school: schoolId }).lean();
      let RAZORPAY_KEY_ID = "";
      let RAZORPAY_SECRET = "";

      if (appsettingData.length == 0) {
        res.status(404).json({
          success: false,
          message: "Razor Key And Razor Secret not available",
        });
      } else {
        RAZORPAY_KEY_ID = appsettingData[0]?.RAZORPAY_KEY_ID;
        RAZORPAY_SECRET = appsettingData[0]?.RAZORPAY_SECRET;
      }

      if (RAZORPAY_KEY_ID == "" || RAZORPAY_SECRET == "") {
        res.status(500).json({
          success: false,
          message: "Error in razorOrder",
        });
      }
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      const sha = crypto.createHmac("sha256", RAZORPAY_SECRET);
      //order_id + "|" + razorpay_payment_id
      sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = sha.digest("hex");
      if (digest !== razorpay_signature) {
        return res.status(400).json({ msg: "Transaction is not legit!" });
      }

      res.json({
        msg: "success",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } catch (e) {
      console.error("Error in razorOrder", e);
      res.status(500).json({
        success: false,
        message: "Error in razorOrder",
      });
    }
  },

  getAppsettingWithId: async (req, res) => {
    // const id = req.params.id;
    const schoolId = req.params.id;
    appsetting
      .findOne({ school: schoolId })
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Appsetting data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getAppsettingWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Appsetting Data",
        });
      });
  },
  decryptData: async (req, res) => {
    const encryptedData = req.body;
    try {
      // 1. Decode Base64URL
      const buffer = Buffer.from(encryptedData.invoiceList, "base64url");

      // 2. Extract IV, authentication tag and encrypted data
      const iv = buffer.subarray(0, 12);
      const authTag = buffer.subarray(12, 28);
      const encrypted = buffer.subarray(28);

      // 3. Decrypt
      const decipher = crypto.createDecipheriv(algorithm, SECRET_KEY, iv);

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // 4. Decompress
      const decompressed = zlib.inflateRawSync(decrypted);
      await res.status(200).json({
        success: true,
        data: JSON.parse(decompressed.toString("utf8")),
      });
      // return JSON.parse(decompressed.toString("utf8"));
    } catch (error) {
      console.error("Decryption Error:", error.message);
      // throw error;
      res.status(500).json({
        success: false,
        message: "Decryption Error " + error.message,
      });
    }
  },
  printReceipt: async (req, res) => {
    try {
      const filterQuery = {};
      // const schoolId = req.user.schoolId;
      // const recDetails = req.body.receiptDetails || [];
      // const schoolId = recDetails[0].school || "";

      let schoolId = "";
      if (req.query.school) {
        schoolId = req.query.school;
      }
      console.log(schoolId, "schoolId");

      const appsettingData = await appsetting.findOne({ school: schoolId });
      console.log("appsettingData", appsettingData);
      const print_tax =
        (appsettingData && appsettingData.appsettingData?.print_tax) || false;

      filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);

      let id = "";
      if (req.query.id) {
        id = new mongoose.Types.ObjectId(req.query.id);
        filterQuery._id = id;
      }

      const printReceipt = await Receipt.findById(filterQuery)
        .populate("school")
        .lean();

      const printReceiptdetail = await Receiptdetail.find({
        receiptId: id,
      })
        .populate("class")
        .populate("section")
        .populate("student")
        .populate("parent")
        .lean();
      console.log(JSON.stringify(printReceiptdetail));

      const siIds = [...new Set(printReceiptdetail.map((item) => item.siId))];
      console.log(siIds);

      const salesinvoiceDetails = await Salesinvoicedetail.find({
        siId: { $in: siIds },
      })
        .populate("feestructure")
        .lean();
      // console.log(JSON.stringify(salesinvoiceDetails));

      const feeNamesByStudent = salesinvoiceDetails.reduce((acc, item) => {
        if (!acc[item.student]) {
          acc[item.student] = [];
        }

        acc[item.student].push(item.feestructure.name);

        return acc;
      }, {});

      // Convert arrays to comma-separated strings
      Object.keys(feeNamesByStudent).forEach((studentId) => {
        feeNamesByStudent[studentId] = feeNamesByStudent[studentId].join(", ");
      });

      console.log(feeNamesByStudent);

      if (!printReceipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      // ==============================
      // PDF INIT
      // ==============================

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape", // ✅ IMPORTANT
        margin: 30,
      });

      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Receipt-${printReceipt.receiptCode}.pdf`,
      });

      doc.pipe(res);

      const schoolInfo = printReceipt?.school || {};

      // ==============================
      // HEADER WITH LOGO
      // ==============================

      const logoX = 40;
      const logoY = 30;
      const logoWidth = 55;

      const textStartX = logoX + logoWidth + 15;

      // LOGO
      if (schoolInfo?.school_image) {
        try {
          const img = await axios.get(schoolInfo.school_image, {
            responseType: "arraybuffer",
          });

          doc.image(img.data, logoX, logoY, {
            width: logoWidth,
            height: 55,
          });
        } catch (err) {
          console.log("Logo load failed");
        }
      }

      // SCHOOL NAME
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(schoolInfo.school_name || "School Name", textStartX, logoY, {
          align: "left",
        });

      // ADDRESS
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `${schoolInfo.address || ""}, ${schoolInfo.city || ""}`,
          textStartX,
          logoY + 22,
        );

      doc.text(
        `${schoolInfo.state || ""}, ${schoolInfo.country || ""}`,
        textStartX,
        logoY + 38,
      );

      // DIVIDER
      const dividerY = logoY + 70;

      doc
        .moveTo(40, dividerY)
        .lineTo(doc.page.width - 40, dividerY)
        .stroke();

      // ==============================
      // REPORT TITLE
      // ==============================

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("RECEIPT", 0, dividerY + 15, {
          align: "center",
        });

      let y = dividerY + 55;

      // ==============================
      // RECEIPT DETAILS
      // ==============================

      const leftX = 50;
      const rightX = 320;

      const labelWidth = 110;
      const valueWidth = 180;

      const rowGap = 25;

      const drawField = (label, value, x, currentY) => {
        doc.font("Helvetica-Bold").fontSize(10).text(label, x, currentY, {
          width: labelWidth,
        });

        doc.font("Helvetica").text(value || "-", x + labelWidth, currentY, {
          width: valueWidth,
        });
      };

      // ROW 1
      drawField(
        "Receipt # :",
        printReceipt?.receiptCode + "/" + printReceipt?.receiptNumber,
        leftX,
        y,
      );

      drawField(
        "Receipt Date :",
        dayjs(printReceipt.receiptDate).format("DD/MM/YYYY"),
        rightX,
        y,
      );

      y += rowGap;

      // ROW 2
      drawField("Father Name :", printReceiptdetail[0].parent?.name, leftX, y);

      drawField(
        "Mother Name :",
        printReceiptdetail[0].parent?.mother_name,
        rightX,
        y,
      );

      y += rowGap;

      // ROW 3
      drawField("Mode of Pay :", printReceipt?.paymentMethod, leftX, y);

      drawField("Status :", printReceipt.status, rightX, y);

      y += rowGap;
      // ROW 3
      drawField("Academic Year :", printReceipt?.academicyear, leftX, y);

      y += 40;

      // ==============================
      // TABLE CONFIG
      // ==============================

      const tableX = 40;
      const columns = [
        { label: "S.No", width: 40 },
        { label: "Student", width: 170 },
        { label: "Invoice #", width: 90 },
        { label: "Particulars", width: 220 },
        { label: "For Month", width: 110 },
        { label: "Amount", width: 100 },
      ];

      const availableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);

      if (totalWidth > availableWidth) {
        const scale = availableWidth / totalWidth;

        columns.forEach((col) => {
          col.width = Math.floor(col.width * scale);
        });
      }

      // ==============================
      // DRAW TABLE HEADER
      // ==============================

      const drawTableHeader = () => {
        let x = tableX;

        doc.font("Helvetica-Bold").fontSize(9);

        columns.forEach((col) => {
          doc.rect(x, y, col.width, 25).fill("#f2f2f2");

          doc.rect(x, y, col.width, 25).stroke();

          doc.fillColor("black").text(col.label, x + 5, y + 8, {
            width: col.width - 10,
            align: "center",
          });

          x += col.width;
        });

        y += 25;
      };

      drawTableHeader();

      // ==============================
      // DRAW ROW
      // ==============================

      const drawRow = (item, index) => {
        let x = tableX;

        const rowHeight = 30;

        // PAGE BREAK
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = 50;
          drawTableHeader();
        }

        const studentId = item?.student?._id || "";
        const particulars = feeNamesByStudent[studentId];

        console.log(particulars);
        const student_name =
          (item?.student?.name || "-") + " " + (item?.class?.class_name || "-");
        const row = [
          index + 1,
          student_name,
          item?.siCode || "-",
          particulars,
          item?.monthname || "",
          Number(item.paidAmount || 0).toFixed(0),
        ];
        row.forEach((cell, i) => {
          const col = columns[i];

          const isNumberColumn = ["Amount"].includes(col.label);

          doc.rect(x, y, col.width, rowHeight).stroke();

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("black")
            .text(String(cell), x + 5, y + 8, {
              width: col.width - 10,
              align: isNumberColumn ? "right" : "left",
              // align: i >= 3 ? "right" : "left"
            });

          x += col.width;
        });

        y += rowHeight;
      };

      // ==============================
      // TABLE ROWS
      // ==============================

      printReceiptdetail.forEach((item, index) => {
        drawRow(item, index);
      });

      // ==============================
      // TOTAL ROW
      // ==============================

      let x = tableX;

      const totals = printReceiptdetail.reduce(
        (acc, item) => {
          acc.paidAmount += Number(item.paidAmount || 0);

          return acc;
        },
        {
          paidAmount: 0,
        },
      );

      const totalRow = ["", "", "", "", "TOTAL", totals.paidAmount.toFixed(0)];
      totalRow.forEach((cell, i) => {
        const col = columns[i];

        doc.rect(x, y, col.width, 30).fillAndStroke("#f9f9f9", "#000");

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("black")
          .text(String(cell), x + 5, y + 8, {
            width: col.width - 10,
            align: i >= 3 ? "right" : "center",
          });

        x += col.width;
      });

      y += 50;

      // ==============================
      // FOOTER
      // ==============================
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("Authorized Signature", doc.page.width - 280, y);

      // ==============================
      // END PDF
      // ==============================
      doc.end();
    } catch (err) {
      console.error("Error generating invoice PDF", err);
      res.status(500).json({
        success: false,
        message: "Error generating Receipt PDF",
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
