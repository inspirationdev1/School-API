require("dotenv").config();
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const mongoose = require("mongoose");
const Marksheet = require("../model/marksheet.model");
const Marksheetdetail = require("../model/marksheetdetail.model");
const Grade = require("../model/grade.model");

const Subject = require("../model/subject.model");
const Examination = require("../model/examination.model");
const WorkingDays = require("../model/workingdays.model");
const Classsubject = require("../model/classsubject.model");

const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");
const Expense = require("../model/expense.model");
const Expensedetail = require("../model/expensedetail.model");

const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");
const Accounttransaction = require("../model/accounttransaction.model");

const Appsetting = require("../model/appsetting.model");
const School = require("../model/school.model");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const moment = require("moment");

dayjs.extend(utc);

module.exports = {
  printChartOfAccount: async (req, res) => {
    try {
      let filterQuery = {};
      const schoolId = req.user.schoolId;
      console.log(schoolId, "schoolId");
      filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);

      // if (req.query.accountlevel) {
      //     const accountlevelId = new mongoose.Types.ObjectId(req.query.accountlevel);
      //     filterQuery._id = accountlevelId;
      // }

      const accountlevelData = await Accountlevel.find(filterQuery)
        .populate("groupId")
        .populate("school")
        .lean();
      console.log(accountlevelData);

      // if (req.query.accountledger) {
      //     const accountledgerId = new mongoose.Types.ObjectId(req.query.accountledger);
      //     filterQuery._id = accountledgerId;
      // }

      const accountledgerData = await Accountledger.find()
        .populate("groupId")
        .populate("school")
        .lean();
      console.log(accountledgerData);

      let levels = 5;
      let filterLevel_1 = [];
      if (!req.query.accountlevel) {
        filterLevel_1 = accountlevelData.filter(
          (item) => item.groupId === null,
        );
      } else {
        filterLevel_1 = accountlevelData.filter(
          (item) => item?._id.toString() === req.query.accountlevel,
        );
      }

      console.log(filterLevel_1);

      let result = [];
      for (const item1 of filterLevel_1) {
        const school = {
          school_name: item1?.school?.school_name,
          address: item1?.school?.address,
          city: item1?.school?.city,
          country: item1?.school?.country,
          school_image: item1?.school?.school_image,
        };
        result.push({
          account_code: item1?.accountlevel_code,
          account_name: item1?.accountlevel_name,
          group_name: item1?.groupId?.accountlevel_name,
          level: item1?.level,
          school: school,
        });

        console.log("groupId:", item1?._id);
        const groupId = item1?._id;

        const filterLevel_5 = accountledgerData.filter(
          (item5) => item5?.groupId?._id?.toString() === groupId?.toString(),
        );
        console.log("filterLevel_5", filterLevel_5);
        for (const item5 of filterLevel_5) {
          console.log("groupId:", item5?.groupId);
          const groupId = item5?.groupId;

          result.push({
            account_code: item5?.accountledger_code,
            account_name: item5?.accountledger_name,
            group_name: item5?.groupId?.accountlevel_name,
            level: item5?.level,
            school: school,
          });
        }

        const filterLevel_2 = accountlevelData.filter(
          (item2) => item2?.groupId?._id?.toString() === groupId?.toString(),
        );
        console.log("filterLevel_2", filterLevel_2);
        for (const item2 of filterLevel_2) {
          console.log("groupId:", item2?._id);
          const groupId = item2?._id;

          result.push({
            account_code: item2?.accountlevel_code,
            account_name: item2?.accountlevel_name,
            group_name: item2?.groupId?.accountlevel_name,
            level: item2?.level,
            school: school,
          });

          const filterLevel_5 = accountledgerData.filter(
            (item5) => item5?.groupId?._id?.toString() === groupId?.toString(),
          );
          console.log("filterLevel_5", filterLevel_5);
          for (const item5 of filterLevel_5) {
            console.log("groupId:", item5?.groupId);
            const groupId = item5?.groupId;

            result.push({
              account_code: item5?.accountledger_code,
              account_name: item5?.accountledger_name,
              group_name: item5?.groupId?.accountlevel_name,
              level: item5?.level,
              school: school,
            });
          }

          const filterLevel_3 = accountlevelData.filter(
            (item3) => item3?.groupId?._id?.toString() === groupId?.toString(),
          );
          console.log("filterLevel_3", filterLevel_3);
          for (const item3 of filterLevel_3) {
            console.log("groupId:", item3?._id);
            const groupId = item3?._id;

            result.push({
              account_code: item3?.accountlevel_code,
              account_name: item3?.accountlevel_name,
              group_name: item3?.groupId?.accountlevel_name,
              level: item3?.level,
              school: school,
            });

            const filterLevel_5 = accountledgerData.filter(
              (item5) =>
                item5?.groupId?._id?.toString() === groupId?.toString(),
            );
            console.log("filterLevel_5", filterLevel_5);
            for (const item5 of filterLevel_5) {
              console.log("groupId:", item5?.groupId);
              const groupId = item5?.groupId;

              result.push({
                account_code: item5?.accountledger_code,
                account_name: item5?.accountledger_name,
                group_name: item5?.groupId?.accountlevel_name,
                level: item5?.level,
                school: school,
              });
            }

            const filterLevel_4 = accountlevelData.filter(
              (item4) =>
                item4?.groupId?._id?.toString() === groupId?.toString(),
            );
            console.log("filterLevel_4", filterLevel_4);
            for (const item4 of filterLevel_4) {
              console.log("groupId:", item4?._id);
              const groupId = item4?._id;

              result.push({
                account_code: item4?.accountlevel_code,
                account_name: item4?.accountlevel_name,
                group_name: item4?.groupId?.accountlevel_name,
                level: item4?.level,
                school: school,
              });
              const filterLevel_5 = accountledgerData.filter(
                (item5) =>
                  item5?.groupId?._id?.toString() === groupId?.toString(),
              );
              console.log("filterLevel_5", filterLevel_5);
              for (const item5 of filterLevel_5) {
                console.log("groupId:", item5?.groupId);
                const groupId = item5?.groupId;

                result.push({
                  account_code: item5?.accountledger_code,
                  account_name: item5?.accountledger_name,
                  group_name: item5?.groupId?.accountlevel_name,
                  level: item5?.level,
                  school: school,
                });
              }
            }
          }
        }
      }

      console.log("result", result);

      // ==========================================
      // SCHOOL INFO
      // ==========================================

      const logoX = 40;
      const logoY = 25;
      const logoWidth = 55;

      const textX = 110;
      const schoolInfo = accountlevelData[0]?.school || {};
      const reportHeader = {
        school_name: schoolInfo?.school_name,
        address: schoolInfo?.address,
        city: schoolInfo?.city,
        state: schoolInfo?.state,
        country: schoolInfo?.country,
      };

      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=chart-of-account.pdf",
      );

      doc.pipe(res);

      // ==========================
      // Header
      // ==========================

      let startY = 40;

      // Logo
      // const logoPath = "./public/logo.png";

      // if (fs.existsSync(logoPath)) {
      //     doc.image(logoPath, 40, startY, {
      //         width: 60,
      //         height: 60,
      //     });
      // }
      // =============================
      // SCHOOL LOGO
      // =============================
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
          console.log("School logo load failed");
        }
      }

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(reportHeader.school_name, 120, startY);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `${reportHeader.address}, ${reportHeader.city}`,
          120,
          startY + 22,
        );

      doc.text(
        `${reportHeader.state}, ${reportHeader.country}`,
        120,
        startY + 38,
      );

      // ==========================
      // Title
      // ==========================

      doc.moveDown(4);

      doc.fontSize(14).font("Helvetica-Bold").text("CHART OF ACCOUNT", {
        align: "center",
      });

      let tableTop = doc.y + 20;

      // ==========================
      // Table Header
      // ==========================

      const col1 = 40; // Account Code
      const col2 = 130; // Account Name
      const col3 = 320; // Account Group
      const col4 = 470; // Level

      const rowHeight = 25;
      const tableWidth = 500;

      doc.rect(col1, tableTop, tableWidth, rowHeight).stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Account Code", col1 + 5, tableTop + 7, {
          width: 80,
        });

      doc.text("Account Name", col2 + 5, tableTop + 7, {
        width: 180,
      });

      doc.text("Account Group", col3 + 5, tableTop + 7, {
        width: 140,
      });

      doc.text("Level", col4 + 5, tableTop + 7, {
        width: 50,
      });

      // Vertical Lines
      doc
        .moveTo(col2, tableTop)
        .lineTo(col2, tableTop + rowHeight)
        .stroke();

      doc
        .moveTo(col3, tableTop)
        .lineTo(col3, tableTop + rowHeight)
        .stroke();

      doc
        .moveTo(col4, tableTop)
        .lineTo(col4, tableTop + rowHeight)
        .stroke();
      // ==========================
      // Table Rows
      // ==========================

      let y = tableTop + rowHeight;

      result.forEach((row) => {
        // Page break
        if (y > 760) {
          doc.addPage();
          y = 40;
        }

        doc.rect(col1, y, tableWidth, rowHeight).stroke();

        doc
          .font("Helvetica")
          .fontSize(10)
          .text(row.account_code || "", col1 + 5, y + 7, {
            width: 80,
          });

        doc.text(row.account_name || "", col2 + 5, y + 7, {
          width: 180,
        });

        doc.text(row.group_name || "", col3 + 5, y + 7, {
          width: 140,
        });

        doc.text(String(row.level || ""), col4 + 5, y + 7, {
          width: 50,
        });

        // Vertical Lines
        doc
          .moveTo(col2, y)
          .lineTo(col2, y + rowHeight)
          .stroke();

        doc
          .moveTo(col3, y)
          .lineTo(col3, y + rowHeight)
          .stroke();

        doc
          .moveTo(col4, y)
          .lineTo(col4, y + rowHeight)
          .stroke();

        y += rowHeight;
      });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  printTrialBalance: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const schoolData = await School.findById(schoolId).lean();

      let dateFilter = {};

      if (req.query.fromDate) {
        dateFilter.$gte = dayjs.utc(req.query.fromDate).startOf("day").toDate();
      }

      if (req.query.toDate) {
        dateFilter.$lte = dayjs.utc(req.query.toDate).endOf("day").toDate();
      }

      const filterQuery = {};
      if (Object.keys(dateFilter).length > 0) {
        filterQuery.date = dateFilter;
      }
      console.log("FROM:", dateFilter.$gte.toISOString());
      console.log("TO:", dateFilter.$lte.toISOString());

      // ==========================================
      // FETCH TRIAL BALANCE DATA
      // ==========================================

      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);

      const trialBalanceData = await Accounttransaction.aggregate([
        {
          $match: {
            school: new mongoose.Types.ObjectId(schoolId),
            status: "valid",
          },
        },

        {
          $lookup: {
            from: "accountledgers",
            localField: "accountledger",
            foreignField: "_id",
            as: "accountInfo",
          },
        },

        {
          $unwind: "$accountInfo",
        },

        {
          $group: {
            _id: {
              accountledger: "$accountledger",
              account_code: "$accountInfo.accountledger_code",
              account_name: "$accountInfo.accountledger_name",
            },

            // ===========================
            // OPENING DEBIT
            // ===========================
            OP_Debit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$doc_date", fromDate] },
                      { $eq: ["$amount_type", "dr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // OPENING CREDIT
            // ===========================
            OP_Credit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$doc_date", fromDate] },
                      { $eq: ["$amount_type", "cr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // PERIOD DEBIT
            // ===========================
            Debit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$doc_date", fromDate] },
                      { $lte: ["$doc_date", toDate] },
                      { $eq: ["$amount_type", "dr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // PERIOD CREDIT
            // ===========================
            Credit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$doc_date", fromDate] },
                      { $lte: ["$doc_date", toDate] },
                      { $eq: ["$amount_type", "cr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },

        {
          $addFields: {
            // Opening Balance
            OpeningBalance: {
              $subtract: ["$OP_Debit", "$OP_Credit"],
            },

            // Closing Balance
            ClosingBalance: {
              $subtract: [
                {
                  $add: ["$OP_Debit", "$Debit"],
                },
                {
                  $add: ["$OP_Credit", "$Credit"],
                },
              ],
            },
          },
        },

        {
          $addFields: {
            CL_Debit: {
              $cond: [{ $gt: ["$ClosingBalance", 0] }, "$ClosingBalance", 0],
            },

            CL_Credit: {
              $cond: [
                { $lt: ["$ClosingBalance", 0] },
                { $abs: "$ClosingBalance" },
                0,
              ],
            },
          },
        },

        {
          $project: {
            _id: 0,

            account_code: "$_id.account_code",
            account_name: "$_id.account_name",

            OP_Debit: 1,
            OP_Credit: 1,

            Debit: 1,
            Credit: 1,

            CL_Debit: 1,
            CL_Credit: 1,
          },
        },

        {
          $sort: {
            account_code: 1,
          },
        },
      ]);

      console.log(trialBalanceData);
      const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      };

      // ==========================================
      // PDF DOCUMENT
      // ==========================================

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 20,
        bufferPages: true,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=trial-balance.pdf",
      );

      doc.pipe(res);

      // ==========================================
      // HEADER FUNCTION
      // ==========================================

      const drawHeader = async () => {
        const logoX = 40;
        const logoY = 25;
        const logoWidth = 55;

        const schoolInfo = schoolData || {};

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
            console.log("School logo load failed");
          }
        }

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(schoolInfo?.school_name || "", 120, 35);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`${schoolInfo?.address || ""}`, 120, 55);

        doc.text(
          `${schoolInfo?.city || ""}, ${schoolInfo?.state || ""}, ${schoolInfo?.country || ""}`,
          120,
          70,
        );

        doc.moveDown(4);

        doc.fontSize(14).font("Helvetica-Bold").text("TRIAL BALANCE", {
          align: "center",
        });

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `As On ${moment(req.query.asondate || new Date()).format("DD-MMM-YYYY")}`,
            {
              align: "center",
            },
          );
      };

      await drawHeader();

      // ==========================================
      // TABLE HEADER FUNCTION
      // ==========================================

      const rowHeight = 22;

      const colCode = 20; // 80 width
      const colName = 85; // 185 width

      const colOPDr = 270; // 75 width
      const colOPCr = 345; // 75 width

      const colDr = 420; // 75 width
      const colCr = 495; // 75 width

      const colCLDr = 570; // 75 width
      const colCLCr = 645; // 75 width

      const tableWidth = 705;

      const drawTableHeader = (y) => {
        doc.rect(colCode, y, tableWidth, rowHeight).stroke();

        doc.font("Helvetica-Bold").fontSize(9);

        doc.text("Code", colCode + 5, y + 6);
        doc.text("Account Name", colName + 5, y + 6);

        doc.text("OP Debit", colOPDr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text("OP Credit", colOPCr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text("Debit", colDr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text("Credit", colCr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text("CL Debit", colCLDr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text("CL Credit", colCLCr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        [colName, colOPDr, colOPCr, colDr, colCr, colCLDr, colCLCr].forEach(
          (x) => {
            doc
              .moveTo(x, y)
              .lineTo(x, y + rowHeight)
              .stroke();
          },
        );
      };

      let tableTop = doc.y + 20;

      drawTableHeader(tableTop);

      let y = tableTop + rowHeight;

      let totalOPDebit = 0;
      let totalOPCredit = 0;

      let totalDebit = 0;
      let totalCredit = 0;

      let totalCLDebit = 0;
      let totalCLCredit = 0;

      // ==========================================
      // DATA ROWS
      // ==========================================

      for (const row of trialBalanceData) {
        const bottomMargin = 40;

        if (y + rowHeight > doc.page.height - bottomMargin) {
          doc.addPage();

          y = 40;

          drawTableHeader(y);

          y += rowHeight;
        }

        totalOPDebit += Number(row.OP_Debit || 0);
        totalOPCredit += Number(row.OP_Credit || 0);

        totalDebit += Number(row.Debit || 0);
        totalCredit += Number(row.Credit || 0);

        totalCLDebit += Number(row.CL_Debit || 0);
        totalCLCredit += Number(row.CL_Credit || 0);

        doc.rect(colCode, y, tableWidth, rowHeight).stroke();

        doc.font("Helvetica").fontSize(9);

        doc.text(row.account_code || "", colCode + 5, y + 6);

        // doc.text(row.account_name || "", colName + 5, y + 6, { width: 240 });
        doc.text(row.account_name || "", colName + 5, y + 6, {
          width: 175,
          ellipsis: true,
        });

        doc.text(
          row.OP_Debit ? formatAmount(row.OP_Debit) : "",
          colOPDr + 5,
          y + 6,
          {
            width: 65,
            align: "right",
          },
        );

        doc.text(
          row.OP_Credit ? formatAmount(row.OP_Credit) : "",
          colOPCr + 5,
          y + 6,
          {
            width: 65,
            align: "right",
          },
        );

        doc.text(row.Debit ? formatAmount(row.Debit) : "", colDr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text(row.Credit ? formatAmount(row.Credit) : "", colCr + 5, y + 6, {
          width: 65,
          align: "right",
        });

        doc.text(
          row.CL_Debit ? formatAmount(row.CL_Debit) : "",
          colCLDr + 5,
          y + 6,
          {
            width: 65,
            align: "right",
          },
        );

        doc.text(
          row.CL_Credit ? formatAmount(row.CL_Credit) : "",
          colCLCr + 5,
          y + 6,
          {
            width: 65,
            align: "right",
          },
        );

        [colName, colOPDr, colOPCr, colDr, colCr, colCLDr, colCLCr].forEach(
          (x) => {
            doc
              .moveTo(x, y)
              .lineTo(x, y + rowHeight)
              .stroke();
          },
        );

        y += rowHeight;
      }

      if (y + rowHeight > doc.page.height - 40) {
        doc.addPage();

        y = 40;

        drawTableHeader(y);

        y += rowHeight;
      }
      // ==========================================
      // TOTAL ROW
      // ==========================================

      doc.rect(colCode, y, tableWidth, rowHeight).stroke();

      doc.font("Helvetica-Bold").text("TOTAL", colName + 5, y + 6);

      doc.text(formatAmount(totalOPDebit), colOPDr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc.text(formatAmount(totalOPCredit), colOPCr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc.text(formatAmount(totalDebit), colDr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc.text(formatAmount(totalCredit), colCr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc.text(formatAmount(totalCLDebit), colCLDr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc.text(formatAmount(totalCLCredit), colCLCr + 5, y + 6, {
        width: 65,
        align: "right",
      });

      doc
        .moveTo(colOPDr, y)
        .lineTo(colOPDr, y + rowHeight)
        .stroke();

      doc
        .moveTo(colOPCr, y)
        .lineTo(colOPCr, y + rowHeight)
        .stroke();

      doc
        .moveTo(colDr, y)
        .lineTo(colDr, y + rowHeight)
        .stroke();

      doc
        .moveTo(colCr, y)
        .lineTo(colCr, y + rowHeight)
        .stroke();

      doc
        .moveTo(colCLDr, y)
        .lineTo(colCLDr, y + rowHeight)
        .stroke();

      doc
        .moveTo(colCLCr, y)
        .lineTo(colCLCr, y + rowHeight)
        .stroke();
      // ==========================================
      // PAGE NUMBERS
      // ==========================================

      const pages = doc.bufferedPageRange();

      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        const pageHeight = doc.page.height;
        doc
          .fontSize(8)
          .text(`Page ${i + 1} of ${pages.count}`, 20, pageHeight - 50, {
            width: doc.page.width - 40,
            align: "center",
            lineBreak: false,
          });
        // doc
        //   .fontSize(8)
        //   .text(`Page ${i + 1} of ${pages.count}`, 0, pageHeight - 20, {
        //     align: "center",
        //   });
      }

      doc.end();
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  printTrialBalance_Two_Columns: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const schoolData = await School.findById(schoolId).lean();

      // const accounttransactionData = await Accounttransaction.find({
      //   school: schoolId,
      // }).lean();
      // console.log(
      //   "accounttransactionData:",
      //   JSON.stringify(accounttransactionData, null, 2),
      // );

      let dateFilter = {};

      if (req.query.fromDate) {
        dateFilter.$gte = dayjs.utc(req.query.fromDate).startOf("day").toDate();
      }

      if (req.query.toDate) {
        dateFilter.$lte = dayjs.utc(req.query.toDate).endOf("day").toDate();
      }

      const filterQuery = {};
      if (Object.keys(dateFilter).length > 0) {
        filterQuery.date = dateFilter;
      }
      console.log("FROM:", dateFilter.$gte.toISOString());
      console.log("TO:", dateFilter.$lte.toISOString());

      // ==========================================
      // FETCH TRIAL BALANCE DATA
      // ==========================================
      // Replace this with your aggregation query

      //   const trialBalanceData = [
      //     {
      //       account_code: "111101",
      //       account_name: "SBI Current Account",
      //       debit: 850000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "111102",
      //       account_name: "HDFC Current Account",
      //       debit: 275000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "211101",
      //       account_name: "ABC Suppliers",
      //       debit: 0,
      //       credit: 150000,
      //     },
      //   ];
      //   const trialBalanceData = [
      //     {
      //       account_code: "111101",
      //       account_name: "SBI Current A/c",
      //       debit: 850000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "111102",
      //       account_name: "HDFC Current A/c",
      //       debit: 275000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "111201",
      //       account_name: "Cash In Hand",
      //       debit: 45000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "112101",
      //       account_name: "Tuition Fees Receivable",
      //       debit: 125000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "121101",
      //       account_name: "Main School Building",
      //       debit: 5000000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "122101",
      //       account_name: "Bus No 1",
      //       debit: 1200000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "211101",
      //       account_name: "ABC Suppliers",
      //       debit: 0,
      //       credit: 150000,
      //     },
      //     {
      //       account_code: "211102",
      //       account_name: "XYZ Stationers",
      //       debit: 0,
      //       credit: 50000,
      //     },
      //     {
      //       account_code: "212101",
      //       account_name: "CGST Payable",
      //       debit: 0,
      //       credit: 18000,
      //     },
      //     {
      //       account_code: "212102",
      //       account_name: "SGST Payable",
      //       debit: 0,
      //       credit: 18000,
      //     },
      //     {
      //       account_code: "221101",
      //       account_name: "SBI Term Loan",
      //       debit: 0,
      //       credit: 1000000,
      //     },
      //     {
      //       account_code: "311101",
      //       account_name: "Paid Up Capital",
      //       debit: 0,
      //       credit: 5500000,
      //     },
      //     {
      //       account_code: "411101",
      //       account_name: "Class Tuition Fee",
      //       debit: 0,
      //       credit: 1800000,
      //     },
      //     {
      //       account_code: "411201",
      //       account_name: "Admission Fee Income",
      //       debit: 0,
      //       credit: 250000,
      //     },
      //     {
      //       account_code: "412101",
      //       account_name: "School Bus Fee Income",
      //       debit: 0,
      //       credit: 300000,
      //     },
      //     {
      //       account_code: "421101",
      //       account_name: "Savings Interest Income",
      //       debit: 0,
      //       credit: 20000,
      //     },
      //     {
      //       account_code: "511101",
      //       account_name: "Primary Teachers Salary",
      //       debit: 800000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "511102",
      //       account_name: "Secondary Teachers Salary",
      //       debit: 500000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "512101",
      //       account_name: "Office Staff Salary",
      //       debit: 250000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "521101",
      //       account_name: "Electricity Charges",
      //       debit: 120000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "521201",
      //       account_name: "Broadband Charges",
      //       debit: 60000,
      //       credit: 0,
      //     },
      //     {
      //       account_code: "522101",
      //       account_name: "School Stationery Expense",
      //       debit: 81000,
      //       credit: 0,
      //     },
      //   ];

      // const trialBalanceData = await Accounttransaction.aggregate([
      //   {
      //     $match: {
      //       school: new mongoose.Types.ObjectId(schoolId),
      //       status: "valid",
      //       // ✅ Date filter
      //       ...(Object.keys(dateFilter).length > 0 && {
      //         "doc_date": dateFilter,
      //       }),
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "accountledgers",
      //       localField: "accountledger",
      //       foreignField: "_id",
      //       as: "accountInfo",
      //     },
      //   },
      //   {
      //     $unwind: "$accountInfo",
      //   },
      //   {
      //     $group: {
      //       _id: {
      //         account_code: "$accountInfo.accountledger_code",
      //         account_name: "$accountInfo.accountledger_name",
      //       },
      //       debit: {
      //         $sum: {
      //           $cond: [{ $eq: ["$amount_type", "dr"] }, "$amount", 0],
      //         },
      //       },
      //       credit: {
      //         $sum: {
      //           $cond: [{ $eq: ["$amount_type", "cr"] }, "$amount", 0],
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 0,
      //       account_code: "$_id.account_code",
      //       account_name: "$_id.account_name",
      //       debit: 1,
      //       credit: 1,
      //     },
      //   },
      //   {
      //     $sort: {
      //       account_code: 1,
      //     },
      //   },
      // ]);

      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);

      const trialBalanceData = await Accounttransaction.aggregate([
        {
          $match: {
            school: new mongoose.Types.ObjectId(schoolId),
            status: "valid",
          },
        },

        {
          $lookup: {
            from: "accountledgers",
            localField: "accountledger",
            foreignField: "_id",
            as: "accountInfo",
          },
        },

        {
          $unwind: "$accountInfo",
        },

        {
          $group: {
            _id: {
              accountledger: "$accountledger",
              account_code: "$accountInfo.accountledger_code",
              account_name: "$accountInfo.accountledger_name",
            },

            // ===========================
            // OPENING DEBIT
            // ===========================
            OP_Debit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$doc_date", fromDate] },
                      { $eq: ["$amount_type", "dr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // OPENING CREDIT
            // ===========================
            OP_Credit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$doc_date", fromDate] },
                      { $eq: ["$amount_type", "cr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // PERIOD DEBIT
            // ===========================
            Debit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$doc_date", fromDate] },
                      { $lte: ["$doc_date", toDate] },
                      { $eq: ["$amount_type", "dr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            // ===========================
            // PERIOD CREDIT
            // ===========================
            Credit: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$doc_date", fromDate] },
                      { $lte: ["$doc_date", toDate] },
                      { $eq: ["$amount_type", "cr"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },

        {
          $addFields: {
            // Opening Balance
            OpeningBalance: {
              $subtract: ["$OP_Debit", "$OP_Credit"],
            },

            // Closing Balance
            ClosingBalance: {
              $subtract: [
                {
                  $add: ["$OP_Debit", "$Debit"],
                },
                {
                  $add: ["$OP_Credit", "$Credit"],
                },
              ],
            },
          },
        },

        {
          $addFields: {
            CL_Debit: {
              $cond: [{ $gt: ["$ClosingBalance", 0] }, "$ClosingBalance", 0],
            },

            CL_Credit: {
              $cond: [
                { $lt: ["$ClosingBalance", 0] },
                { $abs: "$ClosingBalance" },
                0,
              ],
            },
          },
        },

        {
          $project: {
            _id: 0,

            account_code: "$_id.account_code",
            account_name: "$_id.account_name",

            OP_Debit: 1,
            OP_Credit: 1,

            Debit: 1,
            Credit: 1,

            CL_Debit: 1,
            CL_Credit: 1,
          },
        },

        {
          $sort: {
            account_code: 1,
          },
        },
      ]);

      console.log(trialBalanceData);
      const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      };

      // ==========================================
      // PDF DOCUMENT
      // ==========================================

      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=trial-balance.pdf",
      );

      doc.pipe(res);

      // ==========================================
      // HEADER FUNCTION
      // ==========================================

      const drawHeader = async () => {
        const logoX = 40;
        const logoY = 25;
        const logoWidth = 55;

        const schoolInfo = schoolData || {};

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
            console.log("School logo load failed");
          }
        }

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(schoolInfo?.school_name || "", 120, 35);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`${schoolInfo?.address || ""}`, 120, 55);

        doc.text(
          `${schoolInfo?.city || ""}, ${schoolInfo?.state || ""}, ${schoolInfo?.country || ""}`,
          120,
          70,
        );

        doc.moveDown(4);

        doc.fontSize(14).font("Helvetica-Bold").text("TRIAL BALANCE", {
          align: "center",
        });

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `As On ${moment(req.query.asondate || new Date()).format("DD-MMM-YYYY")}`,
            {
              align: "center",
            },
          );
      };

      await drawHeader();

      // ==========================================
      // TABLE HEADER FUNCTION
      // ==========================================

      const rowHeight = 25;

      const col1 = 40; // Code
      const col2 = 130; // Name
      const col3 = 360; // Debit
      const col4 = 455; // Credit

      const tableWidth = 510;

      const drawTableHeader = (y) => {
        doc.rect(col1, y, tableWidth, rowHeight).stroke();

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Account Code", col1 + 5, y + 7);

        doc.text("Account Name", col2 + 5, y + 7);

        doc.text("Debit", col3 + 5, y + 7, {
          width: 80,
          align: "right",
        });

        doc.text("Credit", col4 + 5, y + 7, {
          width: 80,
          align: "right",
        });

        doc
          .moveTo(col2, y)
          .lineTo(col2, y + rowHeight)
          .stroke();

        doc
          .moveTo(col3, y)
          .lineTo(col3, y + rowHeight)
          .stroke();

        doc
          .moveTo(col4, y)
          .lineTo(col4, y + rowHeight)
          .stroke();
      };

      let tableTop = doc.y + 20;

      drawTableHeader(tableTop);

      let y = tableTop + rowHeight;

      let totalDebit = 0;
      let totalCredit = 0;

      // ==========================================
      // DATA ROWS
      // ==========================================

      for (const row of trialBalanceData) {
        if (y > 740) {
          doc.addPage();

          y = 40;

          drawTableHeader(y);

          y += rowHeight;
        }

        totalDebit += Number(row.debit || 0);
        totalCredit += Number(row.credit || 0);

        doc.rect(col1, y, tableWidth, rowHeight).stroke();

        doc
          .font("Helvetica")
          .fontSize(10)
          .text(row.account_code || "", col1 + 5, y + 7);

        doc.text(row.account_name || "", col2 + 5, y + 7, {
          width: 210,
        });

        doc.text(row.debit ? formatAmount(row.debit) : "", col3 + 5, y + 7, {
          width: 80,
          align: "right",
        });

        doc.text(row.credit ? formatAmount(row.credit) : "", col4 + 5, y + 7, {
          width: 80,
          align: "right",
        });

        doc
          .moveTo(col2, y)
          .lineTo(col2, y + rowHeight)
          .stroke();

        doc
          .moveTo(col3, y)
          .lineTo(col3, y + rowHeight)
          .stroke();

        doc
          .moveTo(col4, y)
          .lineTo(col4, y + rowHeight)
          .stroke();

        y += rowHeight;
      }

      // ==========================================
      // TOTAL ROW
      // ==========================================

      doc.rect(col1, y, tableWidth, rowHeight).stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("TOTAL", col2 + 5, y + 7);

      doc.text(formatAmount(totalDebit), col3 + 5, y + 7, {
        width: 80,
        align: "right",
      });

      doc.text(formatAmount(totalCredit), col4 + 5, y + 7, {
        width: 80,
        align: "right",
      });

      doc
        .moveTo(col2, y)
        .lineTo(col2, y + rowHeight)
        .stroke();

      doc
        .moveTo(col3, y)
        .lineTo(col3, y + rowHeight)
        .stroke();

      doc
        .moveTo(col4, y)
        .lineTo(col4, y + rowHeight)
        .stroke();

      // ==========================================
      // PAGE NUMBERS
      // ==========================================

      const pages = doc.bufferedPageRange();

      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        doc.fontSize(8).text(`Page ${i + 1} of ${pages.count}`, 0, 800, {
          align: "center",
        });
      }

      doc.end();
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};

const appsettings = async (schoolId) => {
  const appsettingData = await Appsetting.find({ school: schoolId }).lean();

  return {
    appsettingData: appsettingData[0],
  };
};
