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

const Journalvoucher = require("../model/journalvoucher.model");
const Journalvoucherdetail = require("../model/journalvoucherdetail.model");

const Appsetting = require("../model/appsetting.model");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

module.exports = {

    printFeeInvoice: async (req, res) => {
        try {


            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")

            const appsettingData = await appsettings(schoolId);
            console.log("appsettingData", appsettingData);
            const print_tax = appsettingData && appsettingData.appsettingData?.print_tax || false;

            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            let id = "";
            if (req.query.id) {
                id = new mongoose.Types.ObjectId(req.query.id);
                filterQuery._id = id;
            }


            const printSalesinvoice = await Salesinvoice.findById(filterQuery)
                .populate("school")
                .populate("student")
                .populate("class")
                .populate("section")
                .lean();

            const printSalesinvoicedetail = await Salesinvoicedetail.find({ siId: id })
                .populate("feestructure")
                .lean();

            if (!printSalesinvoice) {
                return res.status(404).json({
                    success: false,
                    message: "Invoice not found"
                });
            }

            // ==============================
            // PDF INIT
            // ==============================

            const doc = new PDFDocument({
                // size: "A4",
                // margin: 40
                size: "A4",
                layout: "landscape", // ✅ IMPORTANT
                margin: 30
            });

            res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=FeeInvoice-${printSalesinvoice.siCode}.pdf`
            });

            doc.pipe(res);

            const schoolInfo = printSalesinvoice.school || {};

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
                        responseType: "arraybuffer"
                    });

                    doc.image(img.data, logoX, logoY, {
                        width: logoWidth,
                        height: 55
                    });

                } catch (err) {
                    console.log("Logo load failed");
                }
            }

            // SCHOOL NAME
            doc
                .font("Helvetica-Bold")
                .fontSize(16)
                .text(
                    schoolInfo.school_name || "School Name",
                    textStartX,
                    logoY,
                    {
                        align: "left"
                    }
                );

            // ADDRESS
            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    `${schoolInfo.address || ""}, ${schoolInfo.city || ""}`,
                    textStartX,
                    logoY + 22
                );

            doc
                .text(
                    `${schoolInfo.state || ""}, ${schoolInfo.country || ""}`,
                    textStartX,
                    logoY + 38
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
                .text("FEE INVOICE", 0, dividerY + 15, {
                    align: "center"
                });

            let y = dividerY + 55;

            // ==============================
            // INVOICE DETAILS
            // ==============================

            const leftX = 50;
            const rightX = 320;

            const labelWidth = 110;
            const valueWidth = 180;

            const rowGap = 25;

            const drawField = (label, value, x, currentY) => {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text(label, x, currentY, {
                        width: labelWidth
                    });

                doc
                    .font("Helvetica")
                    .text(value || "-", x + labelWidth, currentY, {
                        width: valueWidth
                    });
            };

            // ROW 1
            drawField(
                "Invoice # :",
                printSalesinvoice.siCode,
                leftX,
                y
            );

            drawField(
                "Invoice Date :",
                dayjs(printSalesinvoice.invoiceDate).format("DD/MM/YYYY"),
                rightX,
                y
            );

            y += rowGap;

            // ROW 2
            drawField(
                "Class :",
                printSalesinvoice.class?.class_name,
                leftX,
                y
            );

            drawField(
                "Section :",
                printSalesinvoice.section?.section_name,
                rightX,
                y
            );

            y += rowGap;

            // ROW 3
            drawField(
                "Student :",
                printSalesinvoice.student?.name,
                leftX,
                y
            );

            drawField(
                "Status :",
                printSalesinvoice.status,
                rightX,
                y
            );

            y += 40;

            // ==============================
            // TABLE CONFIG
            // ==============================

            const tableX = 40;

            const columns = [
                { label: "S.No", width: 45 },
                { label: "Description", width: 170 },
                { label: "Frequency", width: 90 },
                { label: "Fee Amount", width: 80 },
                { label: "Gross", width: 80 },
                { label: "Discount", width: 80 },

                ...(print_tax ? [
                    { label: "Tax %", width: 70 },
                    { label: "Tax Amount", width: 90 },
                    { label: "Taxable Amount", width: 100 }
                ] : []),

                { label: "Net", width: 80 }
            ];
            const availableWidth =
                doc.page.width - doc.page.margins.left - doc.page.margins.right;

            const totalWidth =
                columns.reduce((sum, c) => sum + c.width, 0);

            if (totalWidth > availableWidth) {

                const scale = availableWidth / totalWidth;

                columns.forEach(col => {
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

                    doc
                        .rect(x, y, col.width, 25)
                        .fill("#f2f2f2");

                    doc
                        .rect(x, y, col.width, 25)
                        .stroke();

                    doc
                        .fillColor("black")
                        .text(
                            col.label,
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: "center"
                            }
                        );

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


                const row = [
                    index + 1,
                    item.feestructure?.name || "-",
                    item.feeFrequency || "-",
                    Number(item.feeAmount || 0).toFixed(0),
                    Number(item.grossAmount || 0).toFixed(0),
                    Number(item.discountAmount || 0).toFixed(0),

                    ...(print_tax ? [
                        Number(item.tax_percent || 0).toFixed(0),
                        Number(item.tax_amount || 0).toFixed(0),
                        Number(item.taxable_amount || 0).toFixed(0)
                    ] : []),

                    Number(item.netAmount || 0).toFixed(0)
                ];





                row.forEach((cell, i) => {

                    const col = columns[i];

                    const isNumberColumn =
                        [
                            "Fee Amount",
                            "Gross",
                            "Discount",
                            "Tax %",
                            "Tax Amount",
                            "Taxable Amount",
                            "Net"
                        ].includes(col.label);

                    doc
                        .rect(x, y, col.width, rowHeight)
                        .stroke();

                    doc
                        .font("Helvetica")
                        .fontSize(9)
                        .fillColor("black")
                        .text(
                            String(cell),
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: isNumberColumn ? "right" : "left"
                                // align: i >= 3 ? "right" : "left"
                            }
                        );

                    x += col.width;
                });

                y += rowHeight;
            };

            // ==============================
            // TABLE ROWS
            // ==============================

            printSalesinvoicedetail.forEach((item, index) => {
                drawRow(item, index);
            });

            // ==============================
            // TOTAL ROW
            // ==============================

            let x = tableX;

            const totals = printSalesinvoicedetail.reduce((acc, item) => {

                acc.gross += Number(item.grossAmount || 0);
                acc.discount += Number(item.discountAmount || 0);
                acc.taxPercent += Number(item.tax_percent || 0);
                acc.taxAmount += Number(item.tax_amount || 0);
                acc.taxable += Number(item.taxable_amount || 0);
                acc.net += Number(item.netAmount || 0);

                return acc;

            }, {
                gross: 0,
                discount: 0,
                taxPercent: 0,
                taxAmount: 0,
                taxable: 0,
                net: 0
            });


            const totalRow = [
                "",
                "",
                "TOTAL",
                "",

                totals.gross.toFixed(0),
                totals.discount.toFixed(0),

                ...(print_tax ? [
                    "",
                    totals.taxAmount.toFixed(0),
                    totals.taxable.toFixed(0)
                ] : []),

                totals.net.toFixed(0)
            ];
            totalRow.forEach((cell, i) => {

                const col = columns[i];

                doc
                    .rect(x, y, col.width, 30)
                    .fillAndStroke("#f9f9f9", "#000");

                doc
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .fillColor("black")
                    .text(
                        String(cell),
                        x + 5,
                        y + 8,
                        {
                            width: col.width - 10,
                            align: i >= 3 ? "right" : "center"
                        }
                    );

                x += col.width;
            });

            y += 50;

            // ==============================
            // FOOTER
            // ==============================

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "Authorized Signature",
                    doc.page.width - 280,
                    y
                );

            // ==============================
            // END PDF
            // ==============================

            doc.end();

        } catch (err) {

            console.error("Error generating invoice PDF", err);

            res.status(500).json({
                success: false,
                message: "Error generating invoice PDF"
            });
        }
    },
    printExpense: async (req, res) => {
        try {


            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")

            const appsettingData = await appsettings(schoolId);
            console.log("appsettingData", appsettingData);
            const print_tax = appsettingData && appsettingData.appsettingData?.print_tax || false;

            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            let id = "";
            if (req.query.id) {
                id = new mongoose.Types.ObjectId(req.query.id);
                filterQuery._id = id;
            }


            const printExpense = await Expense.findById(filterQuery)
                .populate("school")
                .populate("employee")
                .lean();

            const printExpensedetail = await Expensedetail.find({ expenseId: id })
                .populate("expensetype")
                .lean();

            if (!printExpense) {
                return res.status(404).json({
                    success: false,
                    message: "Expense not found"
                });
            }

            // ==============================
            // PDF INIT
            // ==============================

            const doc = new PDFDocument({
                // size: "A4",
                // margin: 40
                size: "A4",
                // layout: "landscape", // ✅ IMPORTANT
                margin: 30
            });

            res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=FeeInvoice-${printExpense.expenseCode}.pdf`
            });

            doc.pipe(res);

            const schoolInfo = printExpense.school || {};

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
                        responseType: "arraybuffer"
                    });

                    doc.image(img.data, logoX, logoY, {
                        width: logoWidth,
                        height: 55
                    });

                } catch (err) {
                    console.log("Logo load failed");
                }
            }

            // SCHOOL NAME
            doc
                .font("Helvetica-Bold")
                .fontSize(16)
                .text(
                    schoolInfo.school_name || "School Name",
                    textStartX,
                    logoY,
                    {
                        align: "left"
                    }
                );

            // ADDRESS
            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    `${schoolInfo.address || ""}, ${schoolInfo.city || ""}`,
                    textStartX,
                    logoY + 22
                );

            doc
                .text(
                    `${schoolInfo.state || ""}, ${schoolInfo.country || ""}`,
                    textStartX,
                    logoY + 38
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
                .text("EXPENSE", 0, dividerY + 15, {
                    align: "center"
                });

            let y = dividerY + 55;

            // ==============================
            // INVOICE DETAILS
            // ==============================

            const leftX = 50;
            const rightX = 320;

            const labelWidth = 110;
            const valueWidth = 180;

            const rowGap = 25;

            const drawField = (label, value, x, currentY) => {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text(label, x, currentY, {
                        width: labelWidth
                    });

                doc
                    .font("Helvetica")
                    .text(value || "-", x + labelWidth, currentY, {
                        width: valueWidth
                    });
            };

            // ROW 1
            drawField(
                "Expense # :",
                printExpense.expenseCode,
                leftX,
                y
            );

            drawField(
                "Invoice Date :",
                dayjs(printExpense.expenseDate).format("DD/MM/YYYY"),
                rightX,
                y
            );

            y += rowGap;





            // ROW 3
            drawField(
                "Employee :",
                printExpense.employee?.employee_name,
                leftX,
                y
            );

            drawField(
                "Status :",
                printExpense.status,
                rightX,
                y
            );

            y += 40;

            
            // ==============================
            // TABLE CONFIG (A4 PORTRAIT FIT)
            // ==============================

            const tableX = doc.page.margins.left;

            const availableWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            let columns = [];

            if (print_tax) {
                columns = [
                    {
                        label: "S.No",
                        width: availableWidth * 0.08
                    },
                    {
                        label: "Description",
                        width: availableWidth * 0.37
                    },
                    {
                        label: "Tax %",
                        width: availableWidth * 0.10
                    },
                     {
                        label: "Taxable Amount",
                        width: availableWidth * 0.15
                    },
                    {
                        label: "Tax Amount",
                        width: availableWidth * 0.15
                    },
                   
                    {
                        label: "Net",
                        width: availableWidth * 0.15
                    }
                ];
            } else {
                columns = [
                    {
                        label: "S.No",
                        width: availableWidth * 0.10
                    },
                    {
                        label: "Description",
                        width: availableWidth * 0.65
                    },
                    {
                        label: "Net",
                        width: availableWidth * 0.25
                    }
                ];
            }

            // ==============================
            // DRAW TABLE HEADER
            // ==============================

            

            const drawTableHeader = () => {

                let x = tableX;

                doc.font("Helvetica-Bold").fontSize(9);

                columns.forEach((col) => {

                    doc
                        .rect(x, y, col.width, 25)
                        .fillAndStroke("#f2f2f2", "#000");

                    doc
                        .fillColor("black")
                        .text(
                            col.label,
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: "center"
                            }
                        );

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

                const row = [
                    index + 1,
                    item.expensetype?.expensetype_name || "-",

                    ...(print_tax
                        ? [
                            Number(item?.tax_percent || 0).toFixed(0),
                            Number(item?.taxable_amount || 0).toFixed(0),
                            Number(item?.tax_amount || 0).toFixed(0),
                            
                        ]
                        : []),

                    Number(item?.expenseAmount || 0).toFixed(0)
                ];

                const descriptionText =
                    item.expensetype?.expensetype_name || "-";

                const descriptionColumnIndex = 1;

                const descriptionHeight = doc.heightOfString(
                    descriptionText,
                    {
                        width:
                            columns[descriptionColumnIndex].width - 10
                    }
                );

                const rowHeight = Math.max(
                    30,
                    descriptionHeight + 12
                );

                // PAGE BREAK
                if (y + rowHeight > doc.page.height - 80) {
                    doc.addPage();
                    y = 50;
                    drawTableHeader();
                }

                row.forEach((cell, i) => {

                    const col = columns[i];

                    const isNumberColumn =
                        [
                            "Tax %",
                            "Taxable Amount",
                            "Tax Amount",
                            "Net"
                        ].includes(col.label);

                    doc
                        .rect(x, y, col.width, rowHeight)
                        .stroke();

                    doc
                        .font("Helvetica")
                        .fontSize(9)
                        .fillColor("black")
                        .text(
                            String(cell),
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: isNumberColumn
                                    ? "right"
                                    : i === 0
                                        ? "center"
                                        : "left"
                            }
                        );

                    x += col.width;
                });

                y += rowHeight;
            };

            // ==============================
            // TABLE ROWS
            // ==============================

            printExpensedetail.forEach((item, index) => {
                drawRow(item, index);
            });

            // ==============================
            // TOTAL ROW
            // ==============================

            

            let totalX = tableX;

            const totals = printExpensedetail.reduce(
                (acc, item) => {

                    acc.taxable += Number(item.taxable_amount || 0);
                    acc.taxAmount += Number(item.tax_amount || 0);
                    acc.net += Number(item.expenseAmount || 0);

                    return acc;

                },
                {
                    taxable: 0,
                    taxAmount: 0,
                    net: 0
                }
            );

            const totalRow = [
                "",
                "TOTAL",

                ...(print_tax
                    ? [
                        "",
                        totals.taxable.toFixed(0),
                        totals.taxAmount.toFixed(0),
                    ]
                    : []),

                totals.net.toFixed(0)
            ];

            const totalRowHeight = 30;

            totalRow.forEach((cell, i) => {

                const col = columns[i];

                doc
                    .rect(
                        totalX,
                        y,
                        col.width,
                        totalRowHeight
                    )
                    .fillAndStroke("#f5f5f5", "#000");

                const isNumberColumn =
                    [
                        "Tax %",
                        "Taxable Amount",
                        "Tax Amount",                        
                        "Net"
                    ].includes(col.label);

                doc
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .fillColor("black")
                    .text(
                        String(cell),
                        totalX + 5,
                        y + 8,
                        {
                            width: col.width - 10,
                            align: isNumberColumn
                                ? "right"
                                : "center"
                        }
                    );

                totalX += col.width;
            });

            y += 40;

            

            // ==============================
            // FOOTER
            // ==============================

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "Authorized Signature",
                    doc.page.width - 280,
                    y
                );

            // ==============================
            // END PDF
            // ==============================

            doc.end();

        } catch (err) {

            console.error("Error generating expense PDF", err);

            res.status(500).json({
                success: false,
                message: "Error generating expense PDF"
            });
        }
    },
    printJournalvoucher: async (req, res) => {
        try {

            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")

            const appsettingData = await appsettings(schoolId);
            console.log("appsettingData", appsettingData);
            const print_tax = appsettingData && appsettingData.appsettingData?.print_tax || false;

            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            let id = "";
            if (req.query.id) {
                id = new mongoose.Types.ObjectId(req.query.id);
                filterQuery._id = id;
            }


            const printJournalvoucher = await Journalvoucher.findById(filterQuery)
                .populate("school")
                .lean();

            const printJournalvoucherdetail = await Journalvoucherdetail.find({ jv_id: id })
                .populate("accountledger")
                .lean();

            if (!printJournalvoucher) {
                return res.status(404).json({
                    success: false,
                    message: "Journalvoucher not found"
                });
            }

            // ==============================
            // PDF INIT
            // ==============================

            const doc = new PDFDocument({
                // size: "A4",
                // margin: 40
                size: "A4",
                // layout: "landscape", // ✅ IMPORTANT
                margin: 30
            });

            res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=FeeInvoice-${printJournalvoucher.jv_code}.pdf`
            });

            doc.pipe(res);

            const schoolInfo = printJournalvoucher.school || {};

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
                        responseType: "arraybuffer"
                    });

                    doc.image(img.data, logoX, logoY, {
                        width: logoWidth,
                        height: 55
                    });

                } catch (err) {
                    console.log("Logo load failed");
                }
            }

            // SCHOOL NAME
            doc
                .font("Helvetica-Bold")
                .fontSize(16)
                .text(
                    schoolInfo.school_name || "School Name",
                    textStartX,
                    logoY,
                    {
                        align: "left"
                    }
                );

            // ADDRESS
            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    `${schoolInfo.address || ""}, ${schoolInfo.city || ""}`,
                    textStartX,
                    logoY + 22
                );

            doc
                .text(
                    `${schoolInfo.state || ""}, ${schoolInfo.country || ""}`,
                    textStartX,
                    logoY + 38
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
                .text("Journalvoucher", 0, dividerY + 15, {
                    align: "center"
                });

            let y = dividerY + 55;

            // ==============================
            // JV DETAILS
            // ==============================

            const leftX = 50;
            const rightX = 320;

            const labelWidth = 110;
            const valueWidth = 180;

            const rowGap = 25;

            const drawField = (label, value, x, currentY) => {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text(label, x, currentY, {
                        width: labelWidth
                    });

                doc
                    .font("Helvetica")
                    .text(value || "-", x + labelWidth, currentY, {
                        width: valueWidth
                    });
            };

            // ROW 1
            drawField(
                "JV # :",
                printJournalvoucher.jv_code,
                leftX,
                y
            );

            drawField(
                "JV Date :",
                dayjs(printJournalvoucher.JournalvoucherDate).format("DD/MM/YYYY"),
                rightX,
                y
            );

            y += rowGap;





            // ROW 3
            // drawField(
            //     "Employee :",
            //     printJournalvoucher.employee?.employee_name,
            //     leftX,
            //     y
            // );

            drawField(
                "Status :",
                printJournalvoucher.status,
                leftX,
                y
            );

            y += 40;

            
            // ==============================
            // TABLE CONFIG (A4 PORTRAIT FIT)
            // ==============================

            const tableX = doc.page.margins.left;

            const availableWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            let columns = [
                    {
                        label: "S.No",
                        width: availableWidth * 0.10
                    },
                    {
                        label: "Account",
                        width: availableWidth * 0.45
                    },
                    {
                        label: "Type",
                        width: availableWidth * 0.15
                    },
                    {
                        label: "Amount",
                        width: availableWidth * 0.25
                    }
                ];

            

            // ==============================
            // DRAW TABLE HEADER
            // ==============================

            

            const drawTableHeader = () => {

                let x = tableX;

                doc.font("Helvetica-Bold").fontSize(9);

                columns.forEach((col) => {

                    doc
                        .rect(x, y, col.width, 25)
                        .fillAndStroke("#f2f2f2", "#000");

                    doc
                        .fillColor("black")
                        .text(
                            col.label,
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: "center"
                            }
                        );

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

                const row = [
                    index + 1,
                    item.accountledger?.accountledger_name || "-",
                    item?.amount_type || "-",

                    Number(item?.jv_amount || 0).toFixed(0)
                ];

                const descriptionText =
                    item.accountledger?.accountledger_name || "-";

                const descriptionColumnIndex = 1;

                const descriptionHeight = doc.heightOfString(
                    descriptionText,
                    {
                        width:
                            columns[descriptionColumnIndex].width - 10
                    }
                );

                const rowHeight = Math.max(
                    30,
                    descriptionHeight + 12
                );

                // PAGE BREAK
                if (y + rowHeight > doc.page.height - 80) {
                    doc.addPage();
                    y = 50;
                    drawTableHeader();
                }

                row.forEach((cell, i) => {

                    const col = columns[i];

                    const isNumberColumn =
                        [
                            "Amount"
                        ].includes(col.label);

                    doc
                        .rect(x, y, col.width, rowHeight)
                        .stroke();

                    doc
                        .font("Helvetica")
                        .fontSize(9)
                        .fillColor("black")
                        .text(
                            String(cell),
                            x + 5,
                            y + 8,
                            {
                                width: col.width - 10,
                                align: isNumberColumn
                                    ? "right"
                                    : i === 0
                                        ? "center"
                                        : "left"
                            }
                        );

                    x += col.width;
                });

                y += rowHeight;
            };

            // ==============================
            // TABLE ROWS
            // ==============================

            printJournalvoucherdetail.forEach((item, index) => {
                drawRow(item, index);
            });

            // ==============================
            // TOTAL ROW
            // ==============================

            

            let totalX = tableX;

            // const totals = printJournalvoucherdetail.reduce(
            //     (acc, item) => {

            //         acc.taxable += Number(item.taxable_amount || 0);
            //         acc.taxAmount += Number(item.tax_amount || 0);
            //         acc.net += Number(item.JournalvoucherAmount || 0);

            //         return acc;

            //     },
            //     {
            //         taxable: 0,
            //         taxAmount: 0,
            //         net: 0
            //     }
            // );

            const totalRow = [
                "",
                "TOTAL",
                printJournalvoucher?.dr_amount.toFixed(0) + " (Dr)",
                printJournalvoucher?.cr_amount.toFixed(0) + " (Cr)",
                
            ];

            const totalRowHeight = 30;

            totalRow.forEach((cell, i) => {

                const col = columns[i];

                doc
                    .rect(
                        totalX,
                        y,
                        col.width,
                        totalRowHeight
                    )
                    .fillAndStroke("#f5f5f5", "#000");

                const isNumberColumn =
                    [
                         "Amount"
                    ].includes(col.label);

                doc
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .fillColor("black")
                    .text(
                        String(cell),
                        totalX + 5,
                        y + 8,
                        {
                            width: col.width - 10,
                            align: isNumberColumn
                                ? "right"
                                : "center"
                        }
                    );

                totalX += col.width;
            });

            y += 40;

            

            // ==============================
            // FOOTER
            // ==============================

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "Authorized Signature",
                    doc.page.width - 280,
                    y
                );

            // ==============================
            // END PDF
            // ==============================

            doc.end();

        } catch (err) {

            console.error("Error generating expense PDF", err);

            res.status(500).json({
                success: false,
                message: "Error generating expense PDF"
            });
        }
    },
    

}

const appsettings = async (schoolId) => {

    const appsettingData = await Appsetting.find({ school: schoolId })
        .lean();

    return {
        appsettingData: appsettingData[0]
    };
};