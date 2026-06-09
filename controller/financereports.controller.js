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

const Appsetting = require("../model/appsetting.model");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

module.exports = {
    printChartOfAccount: async (req, res) => {
        try {


            let filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

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
                filterLevel_1 = accountlevelData.filter(item => item.groupId === null);
            } else {
                filterLevel_1 = accountlevelData.filter(item => item?._id.toString() === req.query.accountlevel);
            }

            console.log(filterLevel_1);

            let result = [];
            for (const item1 of filterLevel_1) {
                const school = {
                    school_name: item1?.school?.school_name
                    , address: item1?.school?.address, city: item1?.school?.city, country: item1?.school?.country,
                    school_image: item1?.school?.school_image,
                };
                result.push(
                    {
                        account_code: item1?.accountlevel_code,
                        account_name: item1?.accountlevel_name,
                        group_name: item1?.groupId?.accountlevel_name,
                        level: item1?.level,
                        school: school
                    }
                );


                console.log("groupId:", item1?._id);
                const groupId = item1?._id;

                const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_5", filterLevel_5);
                    for (const item5 of filterLevel_5) {
                        console.log("groupId:", item5?.groupId);
                        const groupId = item5?.groupId;

                        result.push(
                            {
                                account_code: item5?.accountledger_code,
                                account_name: item5?.accountledger_name,
                                group_name: item5?.groupId?.accountlevel_name,
                                level: item5?.level,
                                school: school
                            }
                        );
                    }

                const filterLevel_2 = accountlevelData.filter(item2 => (item2?.groupId?._id?.toString() === groupId?.toString()));
                console.log("filterLevel_2", filterLevel_2);
                for (const item2 of filterLevel_2) {
                    console.log("groupId:", item2?._id);
                    const groupId = item2?._id;

                    result.push(
                        {
                            account_code: item2?.accountlevel_code,
                            account_name: item2?.accountlevel_name,
                            group_name: item2?.groupId?.accountlevel_name,
                            level: item2?.level,
                            school: school
                        }
                    );

                    const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_5", filterLevel_5);
                    for (const item5 of filterLevel_5) {
                        console.log("groupId:", item5?.groupId);
                        const groupId = item5?.groupId;

                        result.push(
                            {
                                account_code: item5?.accountledger_code,
                                account_name: item5?.accountledger_name,
                                group_name: item5?.groupId?.accountlevel_name,
                                level: item5?.level,
                                school: school
                            }
                        );
                    }

                    const filterLevel_3 = accountlevelData.filter(item3 => (item3?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_3", filterLevel_3);
                    for (const item3 of filterLevel_3) {
                        console.log("groupId:", item3?._id);
                        const groupId = item3?._id;

                        result.push(
                            {
                                account_code: item3?.accountlevel_code,
                                account_name: item3?.accountlevel_name,
                                group_name: item3?.groupId?.accountlevel_name,
                                level: item3?.level,
                                school: school
                            }
                        );

                        const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                        console.log("filterLevel_5", filterLevel_5);
                        for (const item5 of filterLevel_5) {
                            console.log("groupId:", item5?.groupId);
                            const groupId = item5?.groupId;

                            result.push(
                                {
                                    account_code: item5?.accountledger_code,
                                    account_name: item5?.accountledger_name,
                                    group_name: item5?.groupId?.accountlevel_name,
                                    level: item5?.level,
                                    school: school
                                }
                            );
                        }

                        const filterLevel_4 = accountlevelData.filter(item4 => (item4?.groupId?._id?.toString() === groupId?.toString()));
                        console.log("filterLevel_4", filterLevel_4);
                        for (const item4 of filterLevel_4) {
                            console.log("groupId:", item4?._id);
                            const groupId = item4?._id;

                            result.push(
                                {
                                    account_code: item4?.accountlevel_code,
                                    account_name: item4?.accountlevel_name,
                                    group_name: item4?.groupId?.accountlevel_name,
                                    level: item4?.level,
                                    school: school
                                }
                            );
                            const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                            console.log("filterLevel_5", filterLevel_5);
                            for (const item5 of filterLevel_5) {
                                console.log("groupId:", item5?.groupId);
                                const groupId = item5?.groupId;

                                result.push(
                                    {
                                        account_code: item5?.accountledger_code,
                                        account_name: item5?.accountledger_name,
                                        group_name: item5?.groupId?.accountlevel_name,
                                        level: item5?.level,
                                        school: school
                                    }
                                );
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
                "inline; filename=chart-of-account.pdf"
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
                                            responseType: "arraybuffer"
                                        });
            
                                        doc.image(img.data, logoX, logoY, {
                                            width: logoWidth,
                                            height: 55
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
                    startY + 22
                );

            doc.text(
                `${reportHeader.state}, ${reportHeader.country}`,
                120,
                startY + 38
            );

            // ==========================
            // Title
            // ==========================

            doc.moveDown(4);

            doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .text("CHART OF ACCOUNT", {
                    align: "center",
                });

            let tableTop = doc.y + 20;

            // ==========================
            // Table Header
            // ==========================


            const col1 = 40;   // Account Code
            const col2 = 130;  // Account Name
            const col3 = 320;  // Account Group
            const col4 = 470;  // Level

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
            doc.moveTo(col2, tableTop)
                .lineTo(col2, tableTop + rowHeight)
                .stroke();

            doc.moveTo(col3, tableTop)
                .lineTo(col3, tableTop + rowHeight)
                .stroke();

            doc.moveTo(col4, tableTop)
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
                doc.moveTo(col2, y)
                    .lineTo(col2, y + rowHeight)
                    .stroke();

                doc.moveTo(col3, y)
                    .lineTo(col3, y + rowHeight)
                    .stroke();

                doc.moveTo(col4, y)
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


            let filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

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
                filterLevel_1 = accountlevelData.filter(item => item.groupId === null);
            } else {
                filterLevel_1 = accountlevelData.filter(item => item?._id.toString() === req.query.accountlevel);
            }

            console.log(filterLevel_1);

            let result = [];
            for (const item1 of filterLevel_1) {
                const school = {
                    school_name: item1?.school?.school_name
                    , address: item1?.school?.address, city: item1?.school?.city, country: item1?.school?.country,
                    school_image: item1?.school?.school_image,
                };
                result.push(
                    {
                        account_code: item1?.accountlevel_code,
                        account_name: item1?.accountlevel_name,
                        group_name: item1?.groupId?.accountlevel_name,
                        level: item1?.level,
                        school: school
                    }
                );


                console.log("groupId:", item1?._id);
                const groupId = item1?._id;

                const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_5", filterLevel_5);
                    for (const item5 of filterLevel_5) {
                        console.log("groupId:", item5?.groupId);
                        const groupId = item5?.groupId;

                        result.push(
                            {
                                account_code: item5?.accountledger_code,
                                account_name: item5?.accountledger_name,
                                group_name: item5?.groupId?.accountlevel_name,
                                level: item5?.level,
                                school: school
                            }
                        );
                    }

                const filterLevel_2 = accountlevelData.filter(item2 => (item2?.groupId?._id?.toString() === groupId?.toString()));
                console.log("filterLevel_2", filterLevel_2);
                for (const item2 of filterLevel_2) {
                    console.log("groupId:", item2?._id);
                    const groupId = item2?._id;

                    result.push(
                        {
                            account_code: item2?.accountlevel_code,
                            account_name: item2?.accountlevel_name,
                            group_name: item2?.groupId?.accountlevel_name,
                            level: item2?.level,
                            school: school
                        }
                    );

                    const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_5", filterLevel_5);
                    for (const item5 of filterLevel_5) {
                        console.log("groupId:", item5?.groupId);
                        const groupId = item5?.groupId;

                        result.push(
                            {
                                account_code: item5?.accountledger_code,
                                account_name: item5?.accountledger_name,
                                group_name: item5?.groupId?.accountlevel_name,
                                level: item5?.level,
                                school: school
                            }
                        );
                    }

                    const filterLevel_3 = accountlevelData.filter(item3 => (item3?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_3", filterLevel_3);
                    for (const item3 of filterLevel_3) {
                        console.log("groupId:", item3?._id);
                        const groupId = item3?._id;

                        result.push(
                            {
                                account_code: item3?.accountlevel_code,
                                account_name: item3?.accountlevel_name,
                                group_name: item3?.groupId?.accountlevel_name,
                                level: item3?.level,
                                school: school
                            }
                        );

                        const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                        console.log("filterLevel_5", filterLevel_5);
                        for (const item5 of filterLevel_5) {
                            console.log("groupId:", item5?.groupId);
                            const groupId = item5?.groupId;

                            result.push(
                                {
                                    account_code: item5?.accountledger_code,
                                    account_name: item5?.accountledger_name,
                                    group_name: item5?.groupId?.accountlevel_name,
                                    level: item5?.level,
                                    school: school
                                }
                            );
                        }

                        const filterLevel_4 = accountlevelData.filter(item4 => (item4?.groupId?._id?.toString() === groupId?.toString()));
                        console.log("filterLevel_4", filterLevel_4);
                        for (const item4 of filterLevel_4) {
                            console.log("groupId:", item4?._id);
                            const groupId = item4?._id;

                            result.push(
                                {
                                    account_code: item4?.accountlevel_code,
                                    account_name: item4?.accountlevel_name,
                                    group_name: item4?.groupId?.accountlevel_name,
                                    level: item4?.level,
                                    school: school
                                }
                            );
                            const filterLevel_5 = accountledgerData.filter(item5 => (item5?.groupId?._id?.toString() === groupId?.toString()));
                            console.log("filterLevel_5", filterLevel_5);
                            for (const item5 of filterLevel_5) {
                                console.log("groupId:", item5?.groupId);
                                const groupId = item5?.groupId;

                                result.push(
                                    {
                                        account_code: item5?.accountledger_code,
                                        account_name: item5?.accountledger_name,
                                        group_name: item5?.groupId?.accountlevel_name,
                                        level: item5?.level,
                                        school: school
                                    }
                                );
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
                "inline; filename=trial-balance.pdf"
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
                                            responseType: "arraybuffer"
                                        });
            
                                        doc.image(img.data, logoX, logoY, {
                                            width: logoWidth,
                                            height: 55
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
                    startY + 22
                );

            doc.text(
                `${reportHeader.state}, ${reportHeader.country}`,
                120,
                startY + 38
            );

            // ==========================
            // Title
            // ==========================

            doc.moveDown(4);

            doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .text("TRIAL BALANCE", {
                    align: "center",
                });

            let tableTop = doc.y + 20;

            // ==========================
            // Table Header
            // ==========================


            const col1 = 40;   // Account Code
            const col2 = 130;  // Account Name
            const col3 = 320;  // Account Group
            const col4 = 470;  // Level

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
            doc.moveTo(col2, tableTop)
                .lineTo(col2, tableTop + rowHeight)
                .stroke();

            doc.moveTo(col3, tableTop)
                .lineTo(col3, tableTop + rowHeight)
                .stroke();

            doc.moveTo(col4, tableTop)
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
                doc.moveTo(col2, y)
                    .lineTo(col2, y + rowHeight)
                    .stroke();

                doc.moveTo(col3, y)
                    .lineTo(col3, y + rowHeight)
                    .stroke();

                doc.moveTo(col4, y)
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
}

const appsettings = async (schoolId) => {

    const appsettingData = await Appsetting.find({ school: schoolId })
        .lean();

    return {
        appsettingData: appsettingData[0]
    };
};