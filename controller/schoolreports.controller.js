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

const Questionpaper = require("../model/questionpaper.model");
const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");

const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");

const Payment = require("../model/payment.model");
const Paymentdetail = require("../model/paymentdetail.model");

const Attendance = require("../model/attendance.model");

const Student = require("../model/student.model");
const Parent = require("../model/parent.model");
const Teacher = require("../model/teacher.model");
const Employee = require("../model/employee.model");

const Period = require("../model/period.model");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

module.exports = {


    getMarksheetPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Marksheet.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },
                // 🔹 Populate school
                {
                    $lookup: {
                        from: "schools",          // collection name
                        localField: "school",
                        foreignField: "_id",
                        as: "school",
                    },
                },
                {
                    $unwind: "$school",        // convert array → object
                },
                // 🔹 Populate class
                {
                    $lookup: {
                        from: "classes",          // collection name
                        localField: "class",      // field in marksheet
                        foreignField: "_id",      // field in classes
                        as: "class",
                    },
                },
                {
                    $unwind: {
                        path: "$class",
                        preserveNullAndEmptyArrays: true,
                    },
                },


                // 🔹 Populate Section
                {
                    $lookup: {
                        from: "sections",
                        localField: "section",
                        foreignField: "_id",
                        as: "section",
                    },
                },
                {
                    $unwind: {
                        path: "$section",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // 🔹 Populate Teacher
                {
                    $lookup: {
                        from: "teachers",
                        localField: "teacher",
                        foreignField: "_id",
                        as: "teacher",
                    },
                },
                {
                    $unwind: {
                        path: "$teacher",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // 🔹 Populate Subject
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject",
                        foreignField: "_id",
                        as: "subject",
                    },
                },
                {
                    $unwind: {
                        path: "$subject",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // 🔹 Populate Examination
                {
                    $lookup: {
                        from: "examinations",
                        localField: "examination",
                        foreignField: "_id",
                        as: "examination",
                    },
                },
                {
                    $unwind: {
                        path: "$examination",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // 🔹 Populate Questionpaper
                {
                    $lookup: {
                        from: "questionpapers",
                        localField: "questionpaper",
                        foreignField: "_id",
                        as: "questionpaper",
                    },
                },
                {
                    $unwind: {
                        path: "$questionpaper",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "marksheetdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "msId",
                        as: "marksheetDetails",
                    },
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "marksheetDetails.student",
                        foreignField: "_id",
                        as: "studentData",
                    },
                },
                {
                    $addFields: {
                        marksheetDetails: {
                            $map: {
                                input: "$marksheetDetails",
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
                // 🔹 SUM marks
                {
                    $addFields: {
                        totalMarks: {
                            $sum: "$marksheetDetails.marks",
                        },

                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getMarksheetPrint",
            });
        }
    },


    getIncomeExpensePrint: async (req, res) => {
        try {
            // const id = req.params.id;



            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            if (req.query.hasOwnProperty('year')) {
                const year = req.query.year;
                filterQuery['year'] = year;
            }
            filterQuery['status'] = "valid";

            let resultIncome = await Salesinvoicedetail.find(filterQuery)
                .populate("feestructure")
                .populate("student")
                .populate("school")
                .lean();
            console.log(resultIncome);

            const resultExpense = await Expensedetail.find(filterQuery)
                .populate("employee")
                .populate("expensetype")
                .populate("school")
                .lean();
            console.log(resultExpense);



            const result = { income: resultIncome, expense: resultExpense };
            console.log(result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getMarksheetPrint",
            });
        }
    },
    getExpensePrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }

            const result = await Expensedetail.aggregate([

                // 🔗 JOIN Expense collection
                {
                    $lookup: {
                        from: "expenses",                // collection name
                        localField: "expenseId",         // field in Expensedetail
                        foreignField: "_id",
                        as: "expense"
                    }
                },

                // 📦 Convert array → object
                { $unwind: "$expense" },

                // 🎯 FILTER
                {
                    $match: {
                        school: schoolId,
                        status: "valid",
                        "expense.status": "valid",

                        // ✅ Date filter
                        ...(Object.keys(dateFilter).length > 0 && {
                            "expense.expenseDate": dateFilter
                        })
                    }
                },

                // 🔗 Populate employee
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },

                // 🔗 Populate expense type
                {
                    $lookup: {
                        from: "expensetypes",
                        localField: "expensetype",
                        foreignField: "_id",
                        as: "expensetype"
                    }
                },
                { $unwind: { path: "$expensetype", preserveNullAndEmptyArrays: true } },

                // 🔗 Populate school
                {
                    $lookup: {
                        from: "schools",
                        localField: "school",
                        foreignField: "_id",
                        as: "school"
                    }
                },
                { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

                // 📊 Optional: Sort by date
                {
                    $sort: { "expense.expenseDate": -1 }
                }

            ]);





            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getMarksheetPrint",
            });
        }
    },
    getIncomePrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }

            const result = await Salesinvoicedetail.aggregate([

                // 🔗 JOIN Salesinvoice collection
                {
                    $lookup: {
                        from: "salesinvoices",                // collection name
                        localField: "siId",         // field in Salesinvoicedetail
                        foreignField: "_id",
                        as: "salesinvoice"
                    }
                },

                // 📦 Convert array → object
                { $unwind: "$salesinvoice" },

                // 🎯 FILTER
                {
                    $match: {
                        school: schoolId,
                        status: "valid",
                        "salesinvoice.status": "valid",

                        // ✅ Date filter
                        ...(Object.keys(dateFilter).length > 0 && {
                            "salesinvoice.invoiceDate": dateFilter
                        })
                    }
                },

                // 🔗 Populate student
                {
                    $lookup: {
                        from: "students",
                        localField: "student",
                        foreignField: "_id",
                        as: "student"
                    }
                },
                { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },


                // 🔗 Populate school
                {
                    $lookup: {
                        from: "schools",
                        localField: "school",
                        foreignField: "_id",
                        as: "school"
                    }
                },
                { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

                // 📊 Optional: Sort by date
                {
                    $sort: { "salesinvoice.invoiceDate": -1 }
                }

            ]);





            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Income not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains salesinvoice + salesinvoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getIncomePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getIncomePrint",
            });
        }
    },
    getAttendancePrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            const filterQuery = {
                school: schoolId
            };
            if (req.query.student) {
                const studentId = new mongoose.Types.ObjectId(req.query.student);
                filterQuery.student = studentId;
            }

            if (req.query.class) {
                const classId = new mongoose.Types.ObjectId(req.query.class);
                filterQuery.class = classId;
            }

            if (req.query.section) {
                const sectionId = new mongoose.Types.ObjectId(req.query.section);
                filterQuery.section = sectionId;
            }


            // let dateFilter = {};
            // if (req.query.fromDate) {
            //     let fromDate = new Date(req.query.fromDate + "T00:00:00.000Z");
            //     const startDate = dayjs(req.query.fromDate).startOf("day").toDate();
            //     dateFilter.$gte = startDate;
            // }

            // if (req.query.toDate) {
            //     let toDate = new Date(req.query.toDate + "T23:59:59.999Z");
            //     const endDate = dayjs(req.query.toDate).endOf("day").toDate();
            //     dateFilter.$lte = endDate;
            // }
            let dateFilter = {};

            if (req.query.fromDate) {
                dateFilter.$gte = dayjs.utc(req.query.fromDate).startOf("day").toDate();
            }

            if (req.query.toDate) {
                dateFilter.$lte = dayjs.utc(req.query.toDate).endOf("day").toDate();
            }

            if (Object.keys(dateFilter).length > 0) {
                filterQuery.date = dateFilter;
            }
            console.log("FROM:", dateFilter.$gte.toISOString());
            console.log("TO:", dateFilter.$lte.toISOString());
            const result = await Attendance.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("student")
                .lean();
            console.log(result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance not found",
                });
            }


            const counts = result.reduce(
                (acc, curr) => {
                    if (curr.status === "Present") acc.present++;
                    if (curr.status === "Absent") acc.absent++;
                    return acc;
                },
                { present: 0, absent: 0 }
            );

            console.log(counts);

            // return res.status(200).json({ success: true, data: result, counts: counts });
            res.status(200).json({
                success: true,
                data: result, // contains attendance
                counts: counts
            });

        } catch (e) {
            console.error("Error in getAttendancePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getAttendancePrint",
            });
        }
    },
    getPendingFeesPrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }

            const matchStage = {
                school: schoolId,
                status: "valid"
            };

            // ✅ Attach date filter only if exists
            if (Object.keys(dateFilter).length > 0) {
                matchStage.invoiceDate = dateFilter;
            }

            const result = await Salesinvoice.aggregate([

                {
                    $match: matchStage
                },

                {
                    $lookup: {
                        from: "salesinvoicedetails",
                        localField: "_id",
                        foreignField: "siId",
                        as: "details"
                    }
                },

                {
                    $unwind: {
                        path: "$details",
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $match: {
                        "details.status": "valid"
                    }
                },

                {
                    $group: {
                        _id: "$_id",
                        siCode: { $first: "$siCode" },
                        invoiceDate: { $first: "$invoiceDate" },
                        student: { $first: "$student" },  // ObjectId
                        school: { $first: "$school" },  // ObjectId
                        invAmount: { $sum: "$details.netAmount" }
                    }
                },

                // ✅ POPULATE STUDENT
                {
                    $lookup: {
                        from: "students",
                        localField: "student",
                        foreignField: "_id",
                        as: "student"
                    }
                },

                {
                    $unwind: {
                        path: "$student",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // ✅ POPULATE SCHOOL
                {
                    $lookup: {
                        from: "schools",
                        localField: "school",
                        foreignField: "_id",
                        as: "school"
                    }
                },

                {
                    $unwind: {
                        path: "$school",
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $sort: { invoiceDate: -1 }
                }

            ]);

            console.log(result);


            const resultReceipts = await Receiptdetail.aggregate([

                // ✅ Filter first
                {
                    $match: {
                        school: schoolId,
                        status: "valid"   // if you have status field
                    }
                },

                // 📊 Group by siId
                {
                    $group: {
                        _id: "$siId",

                        paidAmount: {
                            $sum: "$paidAmount"   // 🔁 change field if different
                        },

                        receipts: {
                            $push: "$$ROOT"       // optional (full data)
                        }
                    }
                }

            ]);

            console.log(resultReceipts);

            result.forEach((row) => {
                const siId = row._id.toString();

                row.paidAmount = 0;
                row.invBal = row.invAmount;

                const receipt = resultReceipts.find(r =>
                    r._id?.toString() === siId
                );

                if (receipt) {
                    row.paidAmount = receipt.paidAmount;
                    row.invBal -= row.paidAmount;
                }
            });

            // ✅ FILTER ONLY BALANCE > 0
            const filteredResult = result.filter(row => row.invBal > 0);

            console.log(filteredResult);


            if (!filteredResult) {
                return res.status(404).json({
                    success: false,
                    message: "Income not found",
                });
            }

            res.status(200).json({
                success: true,
                data: filteredResult, // contains salesinvoice + salesinvoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getIncomePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getIncomePrint",
            });
        }
    },
    getPendingExpensesPrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }

            const matchStage = {
                school: schoolId,
                status: "valid"
            };

            // ✅ Attach date filter only if exists
            if (Object.keys(dateFilter).length > 0) {
                matchStage.expenseDate = dateFilter;
            }

            const result = await Expense.aggregate([

                {
                    $match: matchStage
                },

                {
                    $lookup: {
                        from: "expensedetails",
                        localField: "_id",
                        foreignField: "expenseId",
                        as: "details"
                    }
                },

                {
                    $unwind: {
                        path: "$details",
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $match: {
                        "details.status": "valid"
                    }
                },

                {
                    $group: {
                        _id: "$_id",
                        expenseCode: { $first: "$expenseCode" },
                        expenseDate: { $first: "$expenseDate" },
                        employee: { $first: "$employee" },  // ObjectId
                        school: { $first: "$school" },  // ObjectId
                        expenseAmount: { $sum: "$details.expenseAmount" }
                    }
                },

                // ✅ POPULATE STUDENT
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee",
                        foreignField: "_id",
                        as: "employee"
                    }
                },

                {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // ✅ POPULATE SCHOOL
                {
                    $lookup: {
                        from: "schools",
                        localField: "school",
                        foreignField: "_id",
                        as: "school"
                    }
                },

                {
                    $unwind: {
                        path: "$school",
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $sort: { expenseDate: -1 }
                }

            ]);

            console.log(result);


            const resultPayments = await Paymentdetail.aggregate([

                // ✅ Filter first
                {
                    $match: {
                        school: schoolId,
                        status: "valid"   // if you have status field
                    }
                },

                // 📊 Group by expenseId
                {
                    $group: {
                        _id: "$expenseId",

                        paidAmount: {
                            $sum: "$paidAmount"   // 🔁 change field if different
                        },

                        payments: {
                            $push: "$$ROOT"       // optional (full data)
                        }
                    }
                }

            ]);

            console.log(resultPayments);

            result.forEach((row) => {
                const expenseId = row._id.toString();

                row.paidAmount = 0;
                row.expBal = row.expenseAmount;

                const pay = resultPayments.find(r =>
                    r._id?.toString() === expenseId
                );

                if (pay) {
                    row.paidAmount = pay.paidAmount;
                    row.expBal -= row.paidAmount;
                }
            });

            // ✅ FILTER ONLY BALANCE > 0
            const filteredResult = result.filter(row => row.expBal > 0);

            console.log(filteredResult);


            if (!filteredResult) {
                return res.status(404).json({
                    success: false,
                    message: "Expense not found",
                });
            }

            res.status(200).json({
                success: true,
                data: filteredResult, // contains expense + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getIncomePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getIncomePrint",
            });
        }
    },
    getPaidFeesPrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }




            const result = await Receiptdetail.aggregate([

                {
                    $match: {
                        school: schoolId,
                        status: "valid"
                    }
                },

                // 📊 GROUP BY receiptId
                {
                    $group: {
                        _id: "$receiptId",
                        totalPaid: { $sum: "$paidAmount" },
                        siIds: { $addToSet: "$siId" }
                    }
                },

                // 🔗 JOIN RECEIPT
                {
                    $lookup: {
                        from: "receipts",
                        localField: "_id",
                        foreignField: "_id",
                        as: "receipt"
                    }
                },
                {
                    $unwind: {
                        path: "$receipt",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // 🏫 SCHOOL POPULATE
                {
                    $lookup: {
                        from: "schools",
                        localField: "receipt.school",
                        foreignField: "_id",
                        as: "school"
                    }
                },
                {
                    $unwind: {
                        path: "$school",
                        preserveNullAndEmptyArrays: true
                    }
                },

                // 🔥 JOIN SALESINVOICE USING siIds ARRAY
                {
                    $lookup: {
                        from: "salesinvoices",
                        let: { siIds: "$siIds" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$siIds"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    siCode: 1,
                                    invoiceDate: 1
                                }
                            }
                        ],
                        as: "invoices"
                    }
                },

                // ✅ OPTIONAL DATE FILTER (receiptDate)
                ...(Object.keys(dateFilter).length > 0 ? [{
                    $match: {
                        "receipt.receiptDate": dateFilter
                    }
                }] : []),

                // 🎯 FINAL OUTPUT
                {
                    $project: {
                        _id: 1,
                        totalPaid: 1,
                        invoices: 1,   // ✅ contains siCode + invoiceDate
                        "receipt.receiptCode": 1,
                        "receipt.receiptDate": 1,
                        "receipt.paymentMethod": 1,
                        school: 1
                    }
                },

                {
                    $sort: { "receipt.receiptDate": -1 }
                }

            ]);



            console.log("result", result);




            result.forEach((row) => {
                const siId = row._id.toString();


                const invoices = row.invoices || [];
                row.siCode = "";
                if (invoices.length > 0) {
                    invoices.forEach((si) => {
                        row.siCode = row.siCode + "-" + si.siCode;
                    });
                }
            });


            console.log(result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Income not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains salesinvoice + salesinvoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getIncomePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getIncomePrint",
            });
        }
    },
    getPaidExpensesPrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }




            const result = await Paymentdetail.aggregate([

                {
                    $match: {
                        school: schoolId,
                        status: "valid"
                    }
                },

                // 📊 GROUP BY paymentId
                {
                    $group: {
                        _id: "$paymentId",
                        totalPaid: { $sum: "$paidAmount" },
                        expenseIds: { $addToSet: "$expenseId" }
                    }
                },

                // 🔗 JOIN RECEIPT
                {
                    $lookup: {
                        from: "payments",
                        localField: "_id",
                        foreignField: "_id",
                        as: "payment"
                    }
                },
                {
                    $unwind: {
                        path: "$payment",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // 🏫 SCHOOL POPULATE
                {
                    $lookup: {
                        from: "schools",
                        localField: "payment.school",
                        foreignField: "_id",
                        as: "school"
                    }
                },
                {
                    $unwind: {
                        path: "$school",
                        preserveNullAndEmptyArrays: true
                    }
                },

                // 🔥 JOIN EXPENSE USING expenseIds ARRAY
                {
                    $lookup: {
                        from: "expenses",
                        let: { expenseIds: "$expenseIds" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$expenseIds"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    expenseCode: 1,
                                    expenseDate: 1
                                }
                            }
                        ],
                        as: "expenses"
                    }
                },

                // ✅ OPTIONAL DATE FILTER (paymentDate)
                ...(Object.keys(dateFilter).length > 0 ? [{
                    $match: {
                        "payment.paymentDate": dateFilter
                    }
                }] : []),

                // 🎯 FINAL OUTPUT
                {
                    $project: {
                        _id: 1,
                        totalPaid: 1,
                        expenses: 1,   // ✅ contains expenseCode + expenseDate
                        "payment.paymentCode": 1,
                        "payment.paymentDate": 1,
                        "payment.paymentMethod": 1,
                        school: 1
                    }
                },

                {
                    $sort: { "payment.paymentDate": -1 }
                }

            ]);



            console.log("result", result);




            result.forEach((row) => {
                const expenseId = row._id.toString();


                const expenses = row.expenses || [];
                row.expenseCode = "";
                if (expenses.length > 0) {
                    expenses.forEach((exp) => {
                        row.expenseCode = row.expenseCode + "-" + exp.expenseCode;
                    });
                }
            });


            console.log(result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains expense + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getPaidExpensesPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getPaidExpensesPrint",
            });
        }
    },
    getSchedulePrint: async (req, res) => {
        try {

            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);


            const filterQuery = {
                school: schoolId
            };

            if (req.query.class) {
                const classId = new mongoose.Types.ObjectId(req.query.class);
                filterQuery.class = classId;
            }

            if (req.query.section) {
                const sectionId = new mongoose.Types.ObjectId(req.query.section);
                filterQuery.section = sectionId;
            }

            if (req.query.teacher) {
                const teacherId = new mongoose.Types.ObjectId(req.query.teacher);
                filterQuery.teacher = teacherId;
            }



            const result = await Period.find(filterQuery).populate('class')
                .populate('section').populate('subject').populate("teacher").populate("school")
                .sort({ timeseq: 1 }).lean();

            // console.log("result", result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains expense + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getPaidExpensesPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getPaidExpensesPrint",
            });
        }
    },
    getIncomeExpenseDashboard: async (req, res) => {
        try {
            // const id = req.params.id;



            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            if (req.query.hasOwnProperty('year')) {
                const year = req.query.year;
                filterQuery['year'] = year;
            }
            filterQuery['status'] = "valid";

            let resultIncome = await Salesinvoicedetail.find(filterQuery)
                .populate("feestructure")
                .populate("student")
                .populate("siId")
                .populate("school")
                .lean();
            console.log(resultIncome);

            const resultExpense = await Expensedetail.find(filterQuery)
                .populate("employee")
                .populate("expensetype")
                .populate("expenseId")
                .populate("school")
                .lean();
            console.log(resultExpense);


            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            const monthlyData = {};

            // 👉 Process Income
            resultIncome.forEach((item) => {
                const date = new Date(item?.siId?.invoiceDate);
                const monthIndex = date.getMonth();
                const month = monthNames[monthIndex];

                if (!monthlyData[month]) {
                    monthlyData[month] = { month, income: 0, expense: 0 };
                }

                monthlyData[month].income += Number(item.netAmount || 0);
            });

            // 👉 Process Expense
            resultExpense.forEach((item) => {
                const date = new Date(item?.expenseId?.expenseDate);
                const monthIndex = date.getMonth();
                const month = monthNames[monthIndex];

                if (!monthlyData[month]) {
                    monthlyData[month] = { month, income: 0, expense: 0 };
                }

                monthlyData[month].expense += Number(item.expenseAmount || 0);
            });

            // 👉 Convert object → array
            const result = Object.values(monthlyData);

            // 👉 Optional: Sort by month order
            result.sort((a, b) => {
                return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
            });

            // return res.json(apiData);


            // const result = res.json(apiData);
            // console.log(result);


            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getIncomeExpenseDashboard", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getIncomeExpenseDashboard",
            });
        }
    },
    getAttendanceDashboard: async (req, res) => {
        try {
            const schoolId = new mongoose.Types.ObjectId(req.user.schoolId);

            const filterQuery = {
                school: schoolId
            };

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate + "T00:00:00.000Z");
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate + "T23:59:59.999Z");
                dateFilter.$lte = toDate;
            }

            // ✅ Attach to query
            if (Object.keys(dateFilter).length > 0) {
                filterQuery.date = dateFilter;
            }

            const attendanceData = await Attendance.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("student")
                .lean();
            console.log(attendanceData);


            // const totalPresent = attendanceData.filter(
            //     (item) => item.status === "Present"
            // ).length;

            // const totalAbsent = attendanceData.filter(
            //     (item) => item.status === "Absent"
            // ).length;

            // console.log(totalPresent); // 2
            // console.log(totalAbsent);  // 1

            const result = attendanceData.reduce(
                (acc, item) => {
                    if (item.status === "Present") acc.present++;
                    else if (item.status === "Absent") acc.absent++;
                    return acc;
                },
                { present: 0, absent: 0 }
            );

            console.log(result);

            const totalStudents = attendanceData?.length || 0;


            const chartData = {
                labels: ["Total Students", "Present", "Absent"],
                datasets: [
                    {
                        label: "Students",
                        data: [
                            totalStudents,
                            result.present,
                            result.absent
                        ],
                        backgroundColor: ["#1976d2", "#2e7d32", "#d32f2f"],
                    },
                ],
            };



            if (!chartData) {
                return res.status(404).json({
                    success: false,
                    message: "Data not found",
                });
            }

            res.status(200).json({
                success: true,
                data: chartData, // contains Data
            });

        } catch (e) {
            console.error("Error in getAttendanceDashboard", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getAttendanceDashboard",
            });
        }
    },
    getExamQuestionpaperPrint: async (req, res) => {
        try {


            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);




            if (req.query.class) {
                const classId = new mongoose.Types.ObjectId(req.query.class);
                filterQuery.class = classId;
            }

            if (req.query.section) {
                const sectionId = new mongoose.Types.ObjectId(req.query.section);
                filterQuery.section = sectionId;
            }

            if (req.query.teacher) {
                const teacherId = new mongoose.Types.ObjectId(req.query.teacher);
                filterQuery.teacher = teacherId;
            }



            if (req.query.subject) {
                const subjectId = new mongoose.Types.ObjectId(req.query.subject);
                filterQuery.subject = subjectId;
            }

            if (req.query.examination) {
                const examinationId = new mongoose.Types.ObjectId(req.query.examination);
                filterQuery.examination = examinationId;
            }

            let dateFilter = {};

            if (req.query.fromDate) {
                let fromDate = new Date(req.query.fromDate);
                fromDate.setHours(0, 0, 0, 0);
                dateFilter.$gte = fromDate;
            }

            if (req.query.toDate) {
                let toDate = new Date(req.query.toDate);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = toDate;
            }

            if (Object.keys(dateFilter).length > 0) {
                filterQuery.date = dateFilter;
            }

            const result = await Questionpaper.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("teacher")
                .populate("subject")
                .populate("examination")
                .lean();
            console.log(result);





            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Exam Questionpaper not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains Exam Questionpaper data
            });

        } catch (e) {
            console.error("Error in getExamQuestionpaperPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getExamQuestionpaperPrint",
            });
        }
    },
    getChartOfAccountPrint: async (req, res) => {
        try {


            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            if (req.query.accountlevel) {
                const accountlevelId = new mongoose.Types.ObjectId(req.query.accountlevel);
                filterQuery.groupId = accountlevelId;
            }

            if (req.query.accountledger) {
                const accountledgerId = new mongoose.Types.ObjectId(req.query.accountledger);
                filterQuery._id = accountledgerId;
            }


            const accountlevelData = await Accountlevel.find()
                .populate("groupId")
                .populate("school")
                .lean();
            console.log(accountlevelData);

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
                        school: school
                    }
                );


                console.log("groupId:", item1?._id);
                const groupId = item1?._id;


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
                            school: school
                        }
                    );
                    const filterLevel_3 = accountledgerData.filter(item3 => (item3?.groupId?._id?.toString() === groupId?.toString()));
                    console.log("filterLevel_3", filterLevel_3);
                    for (const item3 of filterLevel_3) {
                        console.log("groupId:", item3?.groupId);
                        const groupId = item3?.groupId;

                        result.push(
                            {
                                account_code: item3?.accountledger_code,
                                account_name: item3?.accountledger_name,
                                group_name: item3?.groupId?.accountlevel_name,
                                school: school
                            }
                        );
                    }





                }

                item1.account_code = item1?.accountlevel_code;
                item1.account_name = item1?.accountlevel_name;
                item1.group_name = item1?.groupId?.accountlevel_name;

            }

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Chart not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result, // contains Exam Questionpaper data
            });

        } catch (e) {
            console.error("Error in getExamQuestionpaperPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getExamQuestionpaperPrint",
            });
        }
    },
    getStudentListPrint: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            if (req.query.class) {
                const classId = new mongoose.Types.ObjectId(req.query.class);
                filterQuery.student_class = classId;
            }

            if (req.query.section) {
                const sectionId = new mongoose.Types.ObjectId(req.query.section);
                filterQuery.section = sectionId;
            }
            let requesttype = "";
            if (req.query.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Student.find(filterQuery)
                .populate("student_class")
                .populate("section")
                .populate("parent")
                .populate("school")
                .lean();



            if (requesttype === "PDF") {


                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape", // ✅ IMPORTANT
                    margin: 30
                });




                // ✅ SET HEADERS BEFORE PIPE
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=studentlist.pdf"
                });

                doc.pipe(res);



                const schoolInfo = data[0]?.school || {};
                // Logo (IMPORTANT)
                // -----------------------------
                // 🏫 HEADER LAYOUT
                // -----------------------------

                const logoX = 40;
                const logoY = 30;
                const logoWidth = 50;

                const textStartX = logoX + logoWidth + 15; // 👉 right of logo
                const textWidth = 400;

                // Logo
                if (schoolInfo?.school_image) {
                    try {
                        const img = await axios.get(schoolInfo.school_image, {
                            responseType: "arraybuffer"
                        });

                        doc.image(img.data, logoX, logoY, {
                            width: logoWidth,
                            height: 50
                        });
                    } catch (err) {
                        console.log("Logo load failed");
                    }
                }

                if (data.length == 0) {
                    // No Data Found (bold)
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(14)
                        .text(
                            "No Data Found",
                            textStartX,
                            logoY,
                            {
                                width: textWidth,
                                align: "center"
                            }
                        );
                    doc.end();
                    return;
                }

                // School Name (bold)
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        schoolInfo.school_name || "School Name",
                        textStartX,
                        logoY,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // Address
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        textStartX,
                        logoY + 20,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // -----------------------------
                // ➖ Divider Line
                // -----------------------------
                const dividerY = logoY + 60;

                doc
                    .moveTo(40, dividerY)
                    .lineTo(doc.page.width - 40, dividerY)
                    .stroke();

                // -----------------------------
                // 📄 REPORT TITLE (with gap)
                // -----------------------------
                const titleY = dividerY + 15;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text("Student List Report", 0, titleY, {
                        align: "center"
                    });

                let y = titleY + 25; // 👉 proper gap after title

                // -----------------------------
                // 📊 TABLE HEADER START
                // -----------------------------

                const tableWidth = doc.page.width - 80; // full width with margins


                const columns = [
                    { label: "Student Name", key: "name", width: tableWidth * 0.15 },
                    { label: "Gender", key: "gender", width: tableWidth * 0.08 },
                    { label: "Parent Name", key: "parent", width: tableWidth * 0.15 },
                    { label: "DOB", key: "dOBDate", width: tableWidth * 0.12 },
                    { label: "Adm Date", key: "joinDate", width: tableWidth * 0.12 },
                    { label: "Class", key: "class", width: tableWidth * 0.10 },
                    { label: "Section", key: "section", width: tableWidth * 0.08 },
                    { label: "Pen", key: "pen", width: tableWidth * 0.10 },
                    { label: "Aadhar", key: "aadhar", width: tableWidth * 0.10 }
                ];


                const getTextHeight = (doc, text, width) => {
                    return doc.heightOfString(text || "-", {
                        width: width - 10
                    });
                };


                const drawHeader = () => {
                    let x = 40;

                    doc.font("Helvetica-Bold").fontSize(9);

                    columns.forEach(col => {

                        // ✅ Draw background FIRST
                        doc.rect(x, y, col.width, 25).fill("#f2f2f2");

                        // ✅ Draw border AFTER
                        doc.rect(x, y, col.width, 25).stroke();

                        // ✅ Reset text color (VERY IMPORTANT)
                        doc.fillColor("black");

                        // ✅ Draw text LAST
                        doc.text(col.label, x + 5, y + 7, {
                            width: col.width - 10,
                            align: "center"
                        });

                        x += col.width;
                    });

                    y += 25;
                };


                // doc.fontSize(9);
                doc.fontSize(10);

                const drawRow = (row, index) => {

                    let x = 40;

                    // 🔥 Calculate dynamic height
                    let maxHeight = 0;

                    const values = columns.map(col => {
                        let value = "-";

                        switch (col.key) {
                            case "name":
                                value = row.name;
                                break;
                            case "gender":
                                value = row.gender;
                                break;
                            case "parent":
                                value = row.parent?.name;
                                break;
                            case "dOBDate":
                                value = row?.dOBDate ? dayjs(row.dOBDate).format("DD-MM-YYYY") : "-";
                                break;
                            case "joinDate":
                                value = row?.joinDate ? dayjs(row.joinDate).format("DD-MM-YYYY") : "-";
                                break;
                            case "class":
                                value = row.student_class?.class_name;
                                break;
                            case "section":
                                value = row.section?.section_name;
                                break;
                            case "pen":
                                value = row.pen_no;
                                break;
                            case "aadhar":
                                value = row.aadhar_no;
                                break;
                        }

                        const height = getTextHeight(doc, value, col.width);
                        if (height > maxHeight) maxHeight = height;

                        return value;
                    });

                    const rowHeight = maxHeight + 10;

                    // 🔁 Page break
                    if (y + rowHeight > doc.page.height - 40) {
                        doc.addPage();
                        y = 50;
                        drawHeader();
                    }

                    // Zebra row (optional)
                    if (index % 2 === 0) {
                        doc.rect(40, y, tableWidth, rowHeight).fill("#fafafa").fillColor("black");
                    }

                    // Draw cells
                    x = 40;

                    values.forEach((value, i) => {
                        const col = columns[i];
                        // Border
                        doc.rect(x, y, col.width, rowHeight).stroke();

                        // Text (WRAPPED)
                        doc.text(value || "-", x + 5, y + 5, {
                            width: col.width - 10,
                            align: "left"
                        });

                        x += col.width;
                    });

                    y += rowHeight;
                };

                drawHeader();

                data.forEach((row, index) => {
                    drawRow(row, index);
                });

                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            // res.status(500).send("Error generating PDF");
            console.error("Error generating Studentlist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Studentlist",
            });
        }
    },
    getParentListPrint: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            let requesttype = "";
            if (req.query.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Parent.find(filterQuery)
                .populate("school")
                .lean();



            if (requesttype === "PDF") {


                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape", // ✅ IMPORTANT
                    margin: 30
                });




                // ✅ SET HEADERS BEFORE PIPE
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=parentlist.pdf"
                });

                doc.pipe(res);



                const schoolInfo = data[0]?.school || {};
                // Logo (IMPORTANT)
                // -----------------------------
                // 🏫 HEADER LAYOUT
                // -----------------------------

                const logoX = 40;
                const logoY = 30;
                const logoWidth = 50;

                const textStartX = logoX + logoWidth + 15; // 👉 right of logo
                const textWidth = 400;

                // Logo
                if (schoolInfo?.school_image) {
                    try {
                        const img = await axios.get(schoolInfo.school_image, {
                            responseType: "arraybuffer"
                        });

                        doc.image(img.data, logoX, logoY, {
                            width: logoWidth,
                            height: 50
                        });
                    } catch (err) {
                        console.log("Logo load failed");
                    }
                }

                if (data.length == 0) {
                    // No Data Found (bold)
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(14)
                        .text(
                            "No Data Found",
                            textStartX,
                            logoY,
                            {
                                width: textWidth,
                                align: "center"
                            }
                        );
                    doc.end();
                    return;
                }

                // School Name (bold)
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        schoolInfo.school_name || "School Name",
                        textStartX,
                        logoY,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // Address
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        textStartX,
                        logoY + 20,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // -----------------------------
                // ➖ Divider Line
                // -----------------------------
                const dividerY = logoY + 60;

                doc
                    .moveTo(40, dividerY)
                    .lineTo(doc.page.width - 40, dividerY)
                    .stroke();

                // -----------------------------
                // 📄 REPORT TITLE (with gap)
                // -----------------------------
                const titleY = dividerY + 15;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text("Parent List Report", 0, titleY, {
                        align: "center"
                    });

                let y = titleY + 25; // 👉 proper gap after title

                // -----------------------------
                // 📊 TABLE HEADER START
                // -----------------------------

                const tableWidth = doc.page.width - 80; // full width with margins


                const columns = [
                    { label: "Parent Name", key: "name", width: tableWidth * 0.15 },
                    { label: "Gender", key: "gender", width: tableWidth * 0.08 },
                    { label: "Email", key: "email", width: tableWidth * 0.15 },
                    { label: "DOB", key: "dOBDate", width: tableWidth * 0.12 },
                    { label: "Join Date", key: "joinDate", width: tableWidth * 0.12 },
                    { label: "Phone#", key: "phoneno", width: tableWidth * 0.10 }
                ];


                const getTextHeight = (doc, text, width) => {
                    return doc.heightOfString(text || "-", {
                        width: width - 10
                    });
                };


                const drawHeader = () => {
                    let x = 40;

                    doc.font("Helvetica-Bold").fontSize(9);

                    columns.forEach(col => {

                        // ✅ Draw background FIRST
                        doc.rect(x, y, col.width, 25).fill("#f2f2f2");

                        // ✅ Draw border AFTER
                        doc.rect(x, y, col.width, 25).stroke();

                        // ✅ Reset text color (VERY IMPORTANT)
                        doc.fillColor("black");

                        // ✅ Draw text LAST
                        doc.text(col.label, x + 5, y + 7, {
                            width: col.width - 10,
                            align: "center"
                        });

                        x += col.width;
                    });

                    y += 25;
                };


                // doc.fontSize(9);
                doc.fontSize(10);

                const drawRow = (row, index) => {

                    let x = 40;

                    // 🔥 Calculate dynamic height
                    let maxHeight = 0;

                    const values = columns.map(col => {
                        let value = "-";

                        switch (col.key) {
                            case "name":
                                value = row.name;
                                break;
                            case "gender":
                                value = row.gender;
                                break;
                            case "email":
                                value = row?.email;
                                break;
                            case "dOBDate":
                                value = row?.dOBDate ? dayjs(row.dOBDate).format("DD-MM-YYYY") : "-";
                                break;
                            case "joinDate":
                                value = row?.joinDate ? dayjs(row.joinDate).format("DD-MM-YYYY") : "-";
                                break;

                            case "phoneno":
                                value = row?.phoneno;
                                break;
                        }

                        const height = getTextHeight(doc, value, col.width);
                        if (height > maxHeight) maxHeight = height;

                        return value;
                    });

                    const rowHeight = maxHeight + 10;

                    // 🔁 Page break
                    if (y + rowHeight > doc.page.height - 40) {
                        doc.addPage();
                        y = 50;
                        drawHeader();
                    }

                    // Zebra row (optional)
                    if (index % 2 === 0) {
                        doc.rect(40, y, tableWidth, rowHeight).fill("#fafafa").fillColor("black");
                    }

                    // Draw cells
                    x = 40;

                    values.forEach((value, i) => {
                        const col = columns[i];
                        // Border
                        doc.rect(x, y, col.width, rowHeight).stroke();

                        // Text (WRAPPED)
                        doc.text(value || "-", x + 5, y + 5, {
                            width: col.width - 10,
                            align: "left"
                        });

                        x += col.width;
                    });

                    y += rowHeight;
                };

                drawHeader();

                data.forEach((row, index) => {
                    drawRow(row, index);
                });

                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            // res.status(500).send("Error generating PDF");
            console.error("Error generating Parentlist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Parentlist",
            });
        }
    },
    getTeacherListPrint: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            let requesttype = "";
            if (req.query.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Teacher.find(filterQuery)
                .populate("school")
                .lean();



            if (requesttype === "PDF") {


                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape", // ✅ IMPORTANT
                    margin: 30
                });




                // ✅ SET HEADERS BEFORE PIPE
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=teacherlist.pdf"
                });

                doc.pipe(res);



                const schoolInfo = data[0]?.school || {};
                // Logo (IMPORTANT)
                // -----------------------------
                // 🏫 HEADER LAYOUT
                // -----------------------------

                const logoX = 40;
                const logoY = 30;
                const logoWidth = 50;

                const textStartX = logoX + logoWidth + 15; // 👉 right of logo
                const textWidth = 400;

                // Logo
                if (schoolInfo?.school_image) {
                    try {
                        const img = await axios.get(schoolInfo.school_image, {
                            responseType: "arraybuffer"
                        });

                        doc.image(img.data, logoX, logoY, {
                            width: logoWidth,
                            height: 50
                        });
                    } catch (err) {
                        console.log("Logo load failed");
                    }
                }

                if (data.length == 0) {
                    // No Data Found (bold)
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(14)
                        .text(
                            "No Data Found",
                            textStartX,
                            logoY,
                            {
                                width: textWidth,
                                align: "center"
                            }
                        );
                    doc.end();
                    return;
                }

                // School Name (bold)
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        schoolInfo.school_name || "School Name",
                        textStartX,
                        logoY,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // Address
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        textStartX,
                        logoY + 20,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // -----------------------------
                // ➖ Divider Line
                // -----------------------------
                const dividerY = logoY + 60;

                doc
                    .moveTo(40, dividerY)
                    .lineTo(doc.page.width - 40, dividerY)
                    .stroke();

                // -----------------------------
                // 📄 REPORT TITLE (with gap)
                // -----------------------------
                const titleY = dividerY + 15;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text("Teacher List Report", 0, titleY, {
                        align: "center"
                    });

                let y = titleY + 25; // 👉 proper gap after title

                // -----------------------------
                // 📊 TABLE HEADER START
                // -----------------------------

                const tableWidth = doc.page.width - 80; // full width with margins


                const columns = [
                    { label: "Teacher Name", key: "name", width: tableWidth * 0.15 },
                    { label: "Gender", key: "gender", width: tableWidth * 0.08 },
                    { label: "Email", key: "email", width: tableWidth * 0.15 },
                    { label: "DOB", key: "dOBDate", width: tableWidth * 0.12 },
                    { label: "Join Date", key: "joinDate", width: tableWidth * 0.12 },
                    { label: "Phone#", key: "phoneno", width: tableWidth * 0.10 }
                ];


                const getTextHeight = (doc, text, width) => {
                    return doc.heightOfString(text || "-", {
                        width: width - 10
                    });
                };


                const drawHeader = () => {
                    let x = 40;

                    doc.font("Helvetica-Bold").fontSize(9);

                    columns.forEach(col => {

                        // ✅ Draw background FIRST
                        doc.rect(x, y, col.width, 25).fill("#f2f2f2");

                        // ✅ Draw border AFTER
                        doc.rect(x, y, col.width, 25).stroke();

                        // ✅ Reset text color (VERY IMPORTANT)
                        doc.fillColor("black");

                        // ✅ Draw text LAST
                        doc.text(col.label, x + 5, y + 7, {
                            width: col.width - 10,
                            align: "center"
                        });

                        x += col.width;
                    });

                    y += 25;
                };


                // doc.fontSize(9);
                doc.fontSize(10);

                const drawRow = (row, index) => {

                    let x = 40;

                    // 🔥 Calculate dynamic height
                    let maxHeight = 0;

                    const values = columns.map(col => {
                        let value = "-";

                        switch (col.key) {
                            case "name":
                                value = row.name;
                                break;
                            case "gender":
                                value = row.gender;
                                break;
                            case "email":
                                value = row?.email;
                                break;
                            case "dOBDate":
                                value = row?.dOBDate ? dayjs(row.dOBDate).format("DD-MM-YYYY") : "-";
                                break;
                            case "joinDate":
                                value = row?.joinDate ? dayjs(row.joinDate).format("DD-MM-YYYY") : "-";
                                break;

                            case "phoneno":
                                value = row?.phoneno;
                                break;
                        }

                        const height = getTextHeight(doc, value, col.width);
                        if (height > maxHeight) maxHeight = height;

                        return value;
                    });

                    const rowHeight = maxHeight + 10;

                    // 🔁 Page break
                    if (y + rowHeight > doc.page.height - 40) {
                        doc.addPage();
                        y = 50;
                        drawHeader();
                    }

                    // Zebra row (optional)
                    if (index % 2 === 0) {
                        doc.rect(40, y, tableWidth, rowHeight).fill("#fafafa").fillColor("black");
                    }

                    // Draw cells
                    x = 40;

                    values.forEach((value, i) => {
                        const col = columns[i];
                        // Border
                        doc.rect(x, y, col.width, rowHeight).stroke();

                        // Text (WRAPPED)
                        doc.text(value || "-", x + 5, y + 5, {
                            width: col.width - 10,
                            align: "left"
                        });

                        x += col.width;
                    });

                    y += rowHeight;
                };

                drawHeader();

                data.forEach((row, index) => {
                    drawRow(row, index);
                });

                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            // res.status(500).send("Error generating PDF");
            console.error("Error generating Teacherlist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Teacherlist",
            });
        }
    },
    getEmployeeListPrint: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            let requesttype = "";
            if (req.query.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Employee.find(filterQuery)
                .populate("school")
                .lean();



            if (requesttype === "PDF") {


                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape", // ✅ IMPORTANT
                    margin: 30
                });




                // ✅ SET HEADERS BEFORE PIPE
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=employeelist.pdf"
                });

                doc.pipe(res);



                const schoolInfo = data[0]?.school || {};
                // Logo (IMPORTANT)
                // -----------------------------
                // 🏫 HEADER LAYOUT
                // -----------------------------

                const logoX = 40;
                const logoY = 30;
                const logoWidth = 50;

                const textStartX = logoX + logoWidth + 15; // 👉 right of logo
                const textWidth = 400;

                // Logo
                if (schoolInfo?.school_image) {
                    try {
                        const img = await axios.get(schoolInfo.school_image, {
                            responseType: "arraybuffer"
                        });

                        doc.image(img.data, logoX, logoY, {
                            width: logoWidth,
                            height: 50
                        });
                    } catch (err) {
                        console.log("Logo load failed");
                    }
                }

                if (data.length == 0) {
                    // No Data Found (bold)
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(14)
                        .text(
                            "No Data Found",
                            textStartX,
                            logoY,
                            {
                                width: textWidth,
                                align: "center"
                            }
                        );
                    doc.end();
                    return;
                }

                // School Name (bold)
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        schoolInfo.school_name || "School Name",
                        textStartX,
                        logoY,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // Address
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        textStartX,
                        logoY + 20,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // -----------------------------
                // ➖ Divider Line
                // -----------------------------
                const dividerY = logoY + 60;

                doc
                    .moveTo(40, dividerY)
                    .lineTo(doc.page.width - 40, dividerY)
                    .stroke();

                // -----------------------------
                // 📄 REPORT TITLE (with gap)
                // -----------------------------
                const titleY = dividerY + 15;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text("Employee List Report", 0, titleY, {
                        align: "center"
                    });

                let y = titleY + 25; // 👉 proper gap after title

                // -----------------------------
                // 📊 TABLE HEADER START
                // -----------------------------

                const tableWidth = doc.page.width - 80; // full width with margins


                const columns = [
                    { label: "Employee Name", key: "name", width: tableWidth * 0.15 },
                    { label: "Gender", key: "gender", width: tableWidth * 0.08 },
                    { label: "Email", key: "email", width: tableWidth * 0.15 },
                    { label: "DOB", key: "dOBDate", width: tableWidth * 0.12 },
                    { label: "Join Date", key: "joinDate", width: tableWidth * 0.12 },
                    { label: "Phone#", key: "phoneno", width: tableWidth * 0.10 }
                ];


                const getTextHeight = (doc, text, width) => {
                    return doc.heightOfString(text || "-", {
                        width: width - 10
                    });
                };


                const drawHeader = () => {
                    let x = 40;

                    doc.font("Helvetica-Bold").fontSize(9);

                    columns.forEach(col => {

                        // ✅ Draw background FIRST
                        doc.rect(x, y, col.width, 25).fill("#f2f2f2");

                        // ✅ Draw border AFTER
                        doc.rect(x, y, col.width, 25).stroke();

                        // ✅ Reset text color (VERY IMPORTANT)
                        doc.fillColor("black");

                        // ✅ Draw text LAST
                        doc.text(col.label, x + 5, y + 7, {
                            width: col.width - 10,
                            align: "center"
                        });

                        x += col.width;
                    });

                    y += 25;
                };


                // doc.fontSize(9);
                doc.fontSize(10);

                const drawRow = (row, index) => {

                    let x = 40;

                    // 🔥 Calculate dynamic height
                    let maxHeight = 0;

                    const values = columns.map(col => {
                        let value = "-";

                        switch (col.key) {
                            case "name":
                                value = row.employee_name;
                                break;
                            case "gender":
                                value = row.gender;
                                break;
                            case "email":
                                value = row?.email;
                                break;
                            case "dOBDate":
                                value = row?.dOBDate ? dayjs(row.dOBDate).format("DD-MM-YYYY") : "-";
                                break;
                            case "joinDate":
                                value = row?.joinDate ? dayjs(row.joinDate).format("DD-MM-YYYY") : "-";
                                break;

                            case "phoneno":
                                value = row?.phoneno;
                                break;
                        }

                        const height = getTextHeight(doc, value, col.width);
                        if (height > maxHeight) maxHeight = height;

                        return value;
                    });

                    const rowHeight = maxHeight + 10;

                    // 🔁 Page break
                    if (y + rowHeight > doc.page.height - 40) {
                        doc.addPage();
                        y = 50;
                        drawHeader();
                    }

                    // Zebra row (optional)
                    if (index % 2 === 0) {
                        doc.rect(40, y, tableWidth, rowHeight).fill("#fafafa").fillColor("black");
                    }

                    // Draw cells
                    x = 40;

                    values.forEach((value, i) => {
                        const col = columns[i];
                        // Border
                        doc.rect(x, y, col.width, rowHeight).stroke();

                        // Text (WRAPPED)
                        doc.text(value || "-", x + 5, y + 5, {
                            width: col.width - 10,
                            align: "left"
                        });

                        x += col.width;
                    });

                    y += rowHeight;
                };

                drawHeader();

                data.forEach((row, index) => {
                    drawRow(row, index);
                });

                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            // res.status(500).send("Error generating PDF");
            console.error("Error generating Employeelist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Employeelist",
            });
        }
    },
    getStudentList_Marks_Subjectwise_Print: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);





            if (req.query?.class) {
                filterQuery.class = req.query?.class;
            }

            if (req.query?.section) {
                filterQuery.section = req.query?.section;
            }

            if (req.query?.examination) {
                filterQuery.examination = req.query?.examination;
            }

            let requesttype = "";
            if (req.query?.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Marksheetdetail.find(filterQuery)
                .populate("school").populate("class").populate("section").populate("examination")
                .populate("subject").populate("student")
                .lean();
            console.log(data);





            if (requesttype === "PDF") {
                // ============================================
                // PDF DOCUMENT
                // ============================================
                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape",
                    margin: 30
                });

                // ============================================
                // RESPONSE HEADERS
                // ============================================
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition":
                        "attachment; filename=Student-Subjectwise-Report.pdf"
                });

                doc.pipe(res);

                // ============================================
                // NO DATA
                // ============================================
                if (!data.length) {

                    doc
                        .font("Helvetica-Bold")
                        .fontSize(18)
                        .text("No Data Found", 0, 300, {
                            align: "center"
                        });

                    doc.end();
                    return;
                }

                // ============================================
                // SCHOOL INFO
                // ============================================
                const schoolInfo = data[0]?.school || {};

                // ============================================
                // GROUP STUDENTS
                // ============================================
                const studentMap = {};
                const subjectSet = new Set();

                data.forEach(item => {

                    const studentId = item.student?._id?.toString();
                    const subjectName = item.subject?.subject_name || "-";

                    subjectSet.add(subjectName);

                    if (!studentMap[studentId]) {

                        studentMap[studentId] = {
                            studentName: item.student?.name || "-",
                            studentCode: item.student?.student_code || "-",
                            marks: {}
                        };
                    }

                    studentMap[studentId].marks[subjectName] =
                        item.marks || 0;
                });

                const students = Object.values(studentMap);
                const subjects = Array.from(subjectSet);

                // ============================================
                // PAGE WIDTH
                // ============================================
                const pageWidth = doc.page.width;

                // ============================================
                // HEADER
                // ============================================
                const logoX = 40;
                const logoY = 25;

                // ============================================
                // SCHOOL LOGO
                // ============================================
                if (schoolInfo?.school_image) {

                    try {

                        const img = await axios.get(
                            schoolInfo.school_image,
                            {
                                responseType: "arraybuffer"
                            }
                        );

                        doc.image(img.data, logoX, logoY, {
                            width: 55,
                            height: 55
                        });

                    } catch (err) {

                        console.log("Logo load failed");
                    }
                }

                // ============================================
                // SCHOOL NAME
                // ============================================
                doc
                    .font("Helvetica-Bold")
                    .fontSize(20)
                    .text(
                        schoolInfo.school_name || "School Name",
                        110,
                        30
                    );

                // ============================================
                // ADDRESS
                // ============================================
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        110,
                        55
                    );

                // ============================================
                // REPORT TITLE
                // ============================================
                doc
                    .font("Helvetica-Bold")
                    .fontSize(15)
                    .text(
                        "STUDENT-LIST SUBJECT-WISE MARKSHEET REPORT",
                        0,
                        100,
                        {
                            align: "center"
                        }
                    );

                // ============================================
                // DIVIDER
                // ============================================
                doc
                    .moveTo(40, 125)
                    .lineTo(pageWidth - 40, 125)
                    .stroke();

                // ============================================
                // TABLE START
                // ============================================
                let y = 150;
                const startX = 40;

                // ============================================
                // COLUMN WIDTHS
                // ============================================
                const snoWidth = 50;
                const studentWidth = 220;
                const subjectWidth = 90;
                const totalWidth = 90;

                // ============================================
                // DRAW CELL FUNCTION
                // ============================================
                const drawCell = (
                    text,
                    x,
                    y,
                    width,
                    height,
                    bgColor = null,
                    bold = false,
                    align = "center"
                ) => {

                    // Background
                    if (bgColor) {

                        doc
                            .rect(x, y, width, height)
                            .fill(bgColor);
                    }

                    // Border
                    doc
                        .rect(x, y, width, height)
                        .stroke();

                    // Text
                    doc
                        .fillColor("black")
                        .font(
                            bold
                                ? "Helvetica-Bold"
                                : "Helvetica"
                        )
                        .fontSize(9)
                        .text(
                            String(text || "-"),
                            x + 3,
                            y + 8,
                            {
                                width: width - 6,
                                align
                            }
                        );
                };

                // ============================================
                // DRAW TABLE HEADER
                // ============================================
                let x = startX;

                const headerHeight = 30;

                // S.No
                drawCell(
                    "S.No",
                    x,
                    y,
                    snoWidth,
                    headerHeight,
                    "#d9e8ff",
                    true
                );

                x += snoWidth;

                // Student Name
                drawCell(
                    "Student Name",
                    x,
                    y,
                    studentWidth,
                    headerHeight,
                    "#d9e8ff",
                    true
                );

                x += studentWidth;

                // Dynamic Subjects
                subjects.forEach(subject => {

                    drawCell(
                        subject,
                        x,
                        y,
                        subjectWidth,
                        headerHeight,
                        "#d9e8ff",
                        true
                    );

                    x += subjectWidth;
                });

                // Total
                drawCell(
                    "Total",
                    x,
                    y,
                    totalWidth,
                    headerHeight,
                    "#d9e8ff",
                    true
                );

                y += headerHeight;

                // ============================================
                // DRAW STUDENT ROWS
                // ============================================
                students.forEach((student, index) => {

                    // ========================================
                    // PAGE BREAK
                    // ========================================
                    if (y > doc.page.height - 50) {

                        doc.addPage();

                        y = 50;

                        x = startX;

                        drawCell(
                            "S.No",
                            x,
                            y,
                            snoWidth,
                            headerHeight,
                            "#d9e8ff",
                            true
                        );

                        x += snoWidth;

                        drawCell(
                            "Student Name",
                            x,
                            y,
                            studentWidth,
                            headerHeight,
                            "#d9e8ff",
                            true
                        );

                        x += studentWidth;

                        subjects.forEach(subject => {

                            drawCell(
                                subject,
                                x,
                                y,
                                subjectWidth,
                                headerHeight,
                                "#d9e8ff",
                                true
                            );

                            x += subjectWidth;
                        });

                        drawCell(
                            "Total",
                            x,
                            y,
                            totalWidth,
                            headerHeight,
                            "#d9e8ff",
                            true
                        );

                        y += headerHeight;
                    }

                    let total = 0;

                    x = startX;

                    const rowColor =
                        index % 2 === 0
                            ? "#f7f7f7"
                            : null;

                    // ========================================
                    // SERIAL NUMBER
                    // ========================================
                    drawCell(
                        index + 1,
                        x,
                        y,
                        snoWidth,
                        28,
                        rowColor
                    );

                    x += snoWidth;

                    // ========================================
                    // STUDENT NAME
                    // ========================================
                    drawCell(
                        student.studentName,
                        x,
                        y,
                        studentWidth,
                        28,
                        rowColor,
                        false,
                        "left"
                    );

                    x += studentWidth;

                    // ========================================
                    // SUBJECT MARKS
                    // ========================================
                    subjects.forEach(subject => {

                        const marks =
                            student.marks[subject] || 0;

                        total += marks;

                        drawCell(
                            marks,
                            x,
                            y,
                            subjectWidth,
                            28,
                            rowColor
                        );

                        x += subjectWidth;
                    });

                    // ========================================
                    // TOTAL
                    // ========================================
                    drawCell(
                        total,
                        x,
                        y,
                        totalWidth,
                        28,
                        rowColor,
                        true
                    );

                    y += 28;
                });

                // ============================================
                // END PDF
                // ============================================
                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            console.error("Error generating Student_Marks_Subjectwise", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Student_Marks_Subjectwise",
            });
        }
    },
    getStudent_Marks_Subjectwise_Print: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);





            if (req.query?.class) {
                filterQuery.class = req.query?.class;
            }

            if (req.query?.section) {
                filterQuery.section = req.query?.section;
            }

            if (req.query?.examination) {
                filterQuery.examination = req.query?.examination;
            }

            let requesttype = "";
            if (req.query?.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Marksheetdetail.find(filterQuery)
                .populate("school").populate("class").populate("section").populate("examination")
                .populate("subject").populate("student")
                .lean();
            console.log(data);


            if (requesttype === "PDF") {


                // ==========================================
                // CREATE PDF
                // ==========================================
                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape",
                    margin: 30
                });

                // ==========================================
                // RESPONSE HEADERS
                // ==========================================
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=Student-Subjectwise-Marksheet.pdf"
                });

                doc.pipe(res);

                // ==========================================
                // NO DATA
                // ==========================================
                if (!data || data.length === 0) {
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(18)
                        .text("No Data Found", 0, 300, {
                            align: "center"
                        });

                    doc.end();
                    return;
                }

                // ==========================================
                // SCHOOL INFO
                // ==========================================
                const schoolInfo = data[0]?.school || {};

                // ==========================================
                // GROUP DATA BY STUDENT
                // ==========================================
                const groupedStudents = {};

                data.forEach(item => {

                    const studentId = item?.student?._id?.toString();

                    if (!groupedStudents[studentId]) {
                        groupedStudents[studentId] = {
                            student: item.student,
                            class: item.class,
                            section: item.section,
                            examination: item.examination,
                            subjects: []
                        };
                    }

                    groupedStudents[studentId].subjects.push({
                        subject: item.subject?.subject_name || "-",
                        marks: item.marks || 0,
                        marksLimit: item.marksLimit || 0,
                        remarks: item.remarks || "-"
                    });
                });

                const students = Object.values(groupedStudents);

                // ==========================================
                // COMMON POSITIONS
                // ==========================================
                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;

                // ==========================================
                // HEADER FUNCTION
                // ==========================================
                const drawSchoolHeader = async () => {

                    const logoX = 40;
                    const logoY = 25;
                    const logoWidth = 55;

                    const textX = 110;

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

                    // =============================
                    // SCHOOL NAME
                    // =============================
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(20)
                        .fillColor("#003366")
                        .text(
                            schoolInfo.school_name || "School Name",
                            textX,
                            28,
                            {
                                width: 500,
                                align: "left"
                            }
                        );

                    // =============================
                    // ADDRESS
                    // =============================
                    doc
                        .font("Helvetica")
                        .fontSize(10)
                        .fillColor("black")
                        .text(
                            `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                            textX,
                            55,
                            {
                                width: 500,
                                align: "left"
                            }
                        );

                    // =============================
                    // TITLE
                    // =============================
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(16)
                        .fillColor("black")
                        .text(
                            "STUDENT SUBJECT-WISE MARKSHEET REPORT",
                            0,
                            95,
                            {
                                align: "center"
                            }
                        );

                    // =============================
                    // DIVIDER
                    // =============================
                    doc
                        .moveTo(40, 125)
                        .lineTo(pageWidth - 40, 125)
                        .stroke();
                };

                // ==========================================
                // DRAW EACH STUDENT
                // ==========================================
                for (let i = 0; i < students.length; i++) {

                    const item = students[i];

                    // =====================================
                    // NEW PAGE
                    // =====================================
                    if (i !== 0) {
                        doc.addPage();
                    }

                    // =====================================
                    // SCHOOL HEADER
                    // =====================================
                    await drawSchoolHeader();

                    // =====================================
                    // STUDENT INFORMATION
                    // =====================================
                    let y = 145;

                    const student = item.student || {};
                    const examination = item.examination || {};
                    const classInfo = item.class || {};
                    const sectionInfo = item.section || {};

                    // Left Side
                    doc.font("Helvetica-Bold").fontSize(11);

                    doc.text("Student Name", 40, y);
                    doc.text(":", 145, y);
                    doc.font("Helvetica").text(student.name || "-", 155, y);

                    y += 22;

                    doc.font("Helvetica-Bold");
                    doc.text("Student Code", 40, y);
                    doc.text(":", 145, y);
                    doc.font("Helvetica").text(student.student_code || "-", 155, y);

                    y += 22;

                    doc.font("Helvetica-Bold");
                    doc.text("Class", 40, y);
                    doc.text(":", 145, y);
                    doc.font("Helvetica").text(classInfo.class_name || "-", 155, y);

                    y += 22;

                    doc.font("Helvetica-Bold");
                    doc.text("Section", 40, y);
                    doc.text(":", 145, y);
                    doc.font("Helvetica").text(sectionInfo.section_name || "-", 155, y);

                    // Right Side
                    let rightY = 145;

                    doc.font("Helvetica-Bold");
                    doc.text("Exam", 500, rightY);
                    doc.text(":", 610, rightY);
                    doc.font("Helvetica").text(examination.examination_name || "-", 620, rightY);

                    rightY += 22;

                    doc.font("Helvetica-Bold");
                    doc.text("Date", 500, rightY);
                    doc.text(":", 610, rightY);
                    doc.font("Helvetica").text(
                        dayjs(data[0]?.msDate).format("DD-MM-YYYY"),
                        620,
                        rightY
                    );

                    rightY += 22;

                    doc.font("Helvetica-Bold");
                    doc.text("Gender", 500, rightY);
                    doc.text(":", 610, rightY);
                    doc.font("Helvetica").text(student.gender || "-", 620, rightY);

                    // =====================================
                    // TABLE START
                    // =====================================
                    y = 260;

                    const tableX = 40;
                    const tableWidth = pageWidth - 80;

                    const columns = [
                        {
                            label: "S.No",
                            width: tableWidth * 0.10
                        },
                        {
                            label: "Subject",
                            width: tableWidth * 0.35
                        },
                        {
                            label: "Max Marks",
                            width: tableWidth * 0.18
                        },
                        {
                            label: "Obtained Marks",
                            width: tableWidth * 0.18
                        },
                        {
                            label: "Result",
                            width: tableWidth * 0.19
                        }
                    ];

                    // =====================================
                    // TABLE HEADER
                    // =====================================
                    let x = tableX;

                    columns.forEach(col => {

                        doc
                            .rect(x, y, col.width, 30)
                            .fill("#d9e8ff");

                        doc
                            .rect(x, y, col.width, 30)
                            .stroke();

                        doc
                            .fillColor("black")
                            .font("Helvetica-Bold")
                            .fontSize(10)
                            .text(
                                col.label,
                                x,
                                y + 9,
                                {
                                    width: col.width,
                                    align: "center"
                                }
                            );

                        x += col.width;
                    });

                    y += 30;

                    // =====================================
                    // TABLE ROWS
                    // =====================================
                    let totalMarks = 0;
                    let totalLimit = 0;

                    item.subjects.forEach((sub, index) => {

                        const result = sub.marks >= 35 ? "PASS" : "FAIL";

                        totalMarks += sub.marks;
                        totalLimit += sub.marksLimit;

                        const rowHeight = 28;

                        let rowX = tableX;

                        const rowData = [
                            index + 1,
                            sub.subject,
                            sub.marksLimit,
                            sub.marks,
                            result
                        ];

                        rowData.forEach((value, i) => {

                            const col = columns[i];

                            // Zebra Background
                            if (index % 2 === 0) {
                                doc
                                    .rect(rowX, y, col.width, rowHeight)
                                    .fill("#f7f7f7");
                            }

                            // Border
                            doc
                                .rect(rowX, y, col.width, rowHeight)
                                .stroke();

                            // Text
                            doc
                                .fillColor("black")
                                .font("Helvetica")
                                .fontSize(10)
                                .text(
                                    String(value),
                                    rowX,
                                    y + 8,
                                    {
                                        width: col.width,
                                        align: "center"
                                    }
                                );

                            rowX += col.width;
                        });

                        y += rowHeight;
                    });

                    // =====================================
                    // TOTAL ROW
                    // =====================================
                    const percentage = ((totalMarks / totalLimit) * 100).toFixed(2);

                    doc
                        .rect(tableX, y, tableWidth, 35)
                        .fill("#e8e8e8");

                    doc
                        .rect(tableX, y, tableWidth, 35)
                        .stroke();

                    doc
                        .fillColor("black")
                        .font("Helvetica-Bold")
                        .fontSize(11)
                        .text(
                            `TOTAL MARKS : ${totalMarks} / ${totalLimit}`,
                            50,
                            y + 10
                        );

                    doc
                        .text(
                            `PERCENTAGE : ${percentage}%`,
                            500,
                            y + 10
                        );

                    y += 80;

                    // =====================================
                    // SIGNATURES
                    // =====================================
                    doc
                        .font("Helvetica")
                        .fontSize(10)
                        .text("Class Teacher Signature", 60, y);

                    doc
                        .text("Principal Signature", 620, y);

                    // Signature Lines
                    doc
                        .moveTo(50, y - 10)
                        .lineTo(220, y - 10)
                        .stroke();

                    doc
                        .moveTo(600, y - 10)
                        .lineTo(770, y - 10)
                        .stroke();
                }

                // ==========================================
                // END PDF
                // ==========================================
                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            console.error("Error generating Student_Marks_Subjectwise", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Student_Marks_Subjectwise",
            });
        }
    },
    getAttendanceSummaryPrint: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            const filterQuery_WD = {};
            filterQuery_WD["school"] = new mongoose.Types.ObjectId(schoolId);
            if (req.query?.year) {
                filterQuery_WD.year = req.query?.year;
            }
            const workingdaysData = await WorkingDays.find(filterQuery_WD)
                .sort({ seq: 1 })
                .lean();


            if (req.query?.student) {
                filterQuery_WD.student = req.query?.student;
            }
            filterQuery_WD.status = "Present";
            const attendanceData = await Attendance.find(filterQuery_WD)
                .sort({ month: 1 })
                .lean();


            const working_day_obj = workingdaysData.reduce(
                (acc, item) => {
                    acc[item.month_name] = item.work_days; // June:16, July:26...
                    acc.Total += item.work_days;           // calculate total
                    return acc;
                },
                {
                    row_name: "Working Days",
                    Total: 0,
                    Percentage: 100
                }
            );


            const work_days = working_day_obj?.Total;




            const months = [
                "June", "July", "August", "September", "October",
                "November", "December", "January", "February", "March", "April"
            ];

            const present_day_obj = {
                row_name: "Present Days",
                ...Object.fromEntries(months.map(m => [m, 0])),
                Total: 0,
                Percentage: 100
            };

            attendanceData.forEach(item => {
                present_day_obj[item.month_name] += item.attendance_flag;
                present_day_obj.Total += item.attendance_flag;
            });



            const present_days = present_day_obj?.Total;
            const percentage = (present_days / work_days) * 100;
            present_day_obj.Percentage = Number(percentage.toFixed(0));



            const reportData = [
                working_day_obj,
                present_day_obj
            ];

            // const reportData = [
            //     {
            //         row_name: "Working Days",
            //         June: 16,
            //         July: 26,
            //         August: 22,
            //         September: 15,
            //         October: 23,
            //         November: 22,
            //         December: 25,
            //         January: 20,
            //         February: 23,
            //         March: 18,
            //         April: 12,
            //         Total: 222,
            //         Percentage: 100
            //     },
            //     {
            //         row_name: "Present Days",
            //         June: 16,
            //         July: 26,
            //         August: 19,
            //         September: 15,
            //         October: 22,
            //         November: 20,
            //         December: 23,
            //         January: 20,
            //         February: 15,
            //         March: 17,
            //         April: 12,
            //         Total: 205,
            //         Percentage: 92
            //     }
            // ];

            const dynamicColumns = Object.keys(
                reportData[0]
            ).filter(
                key =>
                    key !== "row_name" &&
                    key !== "Total" &&
                    key !== "Percentage"
            );

            const headers = [
                "Month Name",
                ...dynamicColumns,
                "Total",
                "%"
            ];

            const doc = new PDFDocument({
                margin: 20,
                size: "A4",
                layout: "landscape"
            });

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                "inline; filename=attendance-report.pdf"
            );

            doc.pipe(res);

            // -----------------------
            // TITLE
            // -----------------------

            doc
                .fontSize(16)
                .font("Helvetica-Bold")
                .text(
                    "Monthly Attendance Report",
                    { align: "center" }
                );

            doc.moveDown();

            // -----------------------
            // TABLE SETTINGS
            // -----------------------

            let startX = 20;
            let startY = 80;

            const rowHeight = 28;

            const pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            const firstColumnWidth = 110;
            const totalWidth = 55;
            const percentageWidth = 45;

            // Dynamic month width

            const remainingWidth =
                pageWidth -
                firstColumnWidth -
                totalWidth -
                percentageWidth;

            const monthWidth =
                remainingWidth /
                dynamicColumns.length;

            const columnWidths = [
                firstColumnWidth,
                ...dynamicColumns.map(
                    () => monthWidth
                ),
                totalWidth,
                percentageWidth
            ];

            // -----------------------
            // DRAW ROW
            // -----------------------

            const drawRow = (
                y,
                row,
                isHeader = false
            ) => {

                let currentX = startX;

                row.forEach(
                    (cell, index) => {

                        const width =
                            columnWidths[index];

                        doc
                            .rect(
                                currentX,
                                y,
                                width,
                                rowHeight
                            )
                            .stroke();

                        doc
                            .font(
                                isHeader
                                    ? "Helvetica-Bold"
                                    : "Helvetica"
                            )
                            .fontSize(9)
                            .text(
                                String(cell ?? ""),
                                currentX + 2,
                                y + 8,
                                {
                                    width: width - 4,
                                    align: "center"
                                }
                            );

                        currentX += width;
                    }
                );
            };

            // -----------------------
            // HEADER
            // -----------------------

            drawRow(
                startY,
                headers,
                true
            );

            startY += rowHeight;

            // -----------------------
            // DATA
            // -----------------------

            reportData.forEach(
                rowData => {

                    if (
                        startY >
                        doc.page.height - 60
                    ) {

                        doc.addPage();

                        startY = 50;

                        drawRow(
                            startY,
                            headers,
                            true
                        );

                        startY += rowHeight;
                    }

                    const row = [
                        rowData.row_name,

                        ...dynamicColumns.map(
                            month =>
                                rowData[month] ?? "-"
                        ),

                        rowData.Total ?? 0,
                        rowData.Percentage ?? 0
                    ];

                    drawRow(
                        startY,
                        row
                    );

                    startY += rowHeight;
                }
            );

            doc.end();

        }
        catch (error) {

            console.log(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }
    },
    getProgressCardPrint: async (req, res) => {
        try {

            const filterQuery = {};
            const schoolId = req.user.schoolId;

            filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);

            if (req.query?.year) {
                filterQuery.year = req.query?.year;
            }

            if (req.query?.class) {
                filterQuery.class = req.query?.class;
            }

            if (req.query?.section) {
                filterQuery.section = req.query?.section;
            }

            if (req.query?.student) {
                filterQuery.student = req.query?.student;
            }

            if (req.query?.examination) {
                filterQuery.examination = req.query?.examination;
            }

            let requesttype = "";

            if (req.query?.requesttype) {
                requesttype = req.query?.requesttype;
            }

            const marksheetData = await Marksheetdetail.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("examination")
                .populate("subject")
                .populate("student")
                .sort({ examination: 1 })
                .lean();

            const gradeData = await Grade.find({ school: schoolId })
                .sort({ marks_min: -1 })
                .lean();

            let subjectsData = await Classsubject.find({
                school: schoolId,
                class: req.query?.class
            })
                .populate({
                    path: "subject",
                    select: "subject_name -_id"
                })
                .select("subject")
                .sort({ seq: 1 })
                .lean();

            if (subjectsData.length == 0) {
                subjectsData = await Subject.find({ school: schoolId })
                    .select("subject_name -_id")
                    .sort({ seq: 1 })
                    .lean();
            }


            const examsData = await Examination.find({ school: schoolId })
                .select("examination_name -_id")
                .sort({ seq: 1 })
                .lean();



            const filterQuery_WD = {};
            filterQuery_WD["school"] = new mongoose.Types.ObjectId(schoolId);
            if (req.query?.year) {
                filterQuery_WD.year = req.query?.year;
            }
            const workingdaysData = await WorkingDays.find(filterQuery_WD)
                .sort({ seq: 1 })
                .lean();


            if (req.query?.student) {
                filterQuery_WD.student = req.query?.student;
            }
            filterQuery_WD.status = "Present";
            const attendanceData = await Attendance.find(filterQuery_WD)
                .sort({ month: 1 })
                .lean();



            // ============================================
            // PDF
            // ============================================




            let doc = new PDFDocument({
                size: "A3",
                layout: "landscape",
                margins: {
                    top: 25,
                    bottom: 25,
                    left: 25,
                    right: 25,
                },
            });

            res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition":
                    "attachment; filename=Progress-Card.pdf"
            });

            doc.pipe(res);

            // ============================================
            // NO DATA
            // ============================================

            if (!marksheetData.length) {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(18)
                    .text("No Data Found", 0, 300, {
                        align: "center"
                    });

                doc.end();
                return;
            }

            // ============================================
            // TRANSFORM DATA
            // ============================================

            const tableData = transformMarksheetData(marksheetData, subjectsData, examsData);

            const examNames = tableData.exams;
            const subjects = tableData.subjects;



            const subjectLength = Object.keys(subjects).length;
            console.log(subjectLength); // 3



            const reportHeader = {
                school_name: marksheetData[0].school.school_name,
                address: marksheetData[0].school.address,
                city: marksheetData[0].school.city,
                state: marksheetData[0].school.state,
                country: marksheetData[0].school.country,
                class: marksheetData[0].class.class_name,
                section: marksheetData[0].section.section_name,
                student: marksheetData[0].student.name,
                school_image: marksheetData[0].school.school_image
            };

            // ============================================
            // SCHOOL LOGO
            // ============================================

            if (reportHeader?.school_image) {

                try {

                    const img = await axios.get(
                        reportHeader.school_image,
                        {
                            responseType: "arraybuffer"
                        }
                    );

                    doc.image(img.data, 30, 20, {
                        width: 60,
                    });

                } catch (err) {

                    console.log("Logo load failed");
                }
            }

            // ============================================
            // HEADER
            // ============================================

            doc
                .fontSize(26)
                .font("Helvetica-Bold")
                .text(
                    "PROGRESS CARD",
                    0,
                    25,
                    {
                        align: "center"
                    }
                );

            doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .text(
                    reportHeader.school_name,
                    0,
                    60,
                    {
                        align: "center"
                    }
                );

            const address = reportHeader.address + "," + reportHeader.city
                + "," + reportHeader.state + "," + reportHeader.country
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    `${address}`,
                    0,
                    85,
                    {
                        align: "center"
                    });

            // ============================================
            // STUDENT INFO
            // ============================================

            let startY = 120;

            doc.font("Helvetica-Bold")
                .text(
                    "Student :",
                    40,
                    startY
                );

            doc.font("Helvetica")
                .text(
                    reportHeader.student,
                    95,
                    startY
                );

            doc.font("Helvetica-Bold")
                .text(
                    "Class :",
                    300,
                    startY
                );

            doc.font("Helvetica")
                .text(
                    reportHeader.class,
                    340,
                    startY
                );

            doc.font("Helvetica-Bold")
                .text(
                    "Section :",
                    500,
                    startY
                );

            doc.font("Helvetica")
                .text(
                    reportHeader.section,
                    540,
                    startY
                );



            // ============================================
            // TABLE SETTINGS (A3 DYNAMIC)
            // ============================================

            startY += 30;

            let pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            // const subjectWidth = 220;
            const subjectWidth = 100;
            let rowHeight = 35;

            let totalColumns = 0;

            examNames.forEach((exam) => {

                if (exam === "SA-1" || exam === "SA-2") {
                    totalColumns += 5;
                } else {
                    totalColumns += 2;
                }

                if (exam === "SA-2") {
                    totalColumns += 5;
                }

            });

            const availableWidth = pageWidth - subjectWidth;

            const subColumnWidth =
                Math.floor(availableWidth / totalColumns);

            let currentX = doc.page.margins.left;

            // ============================================
            // HEADER ROW 1
            // ============================================

            doc.rect(currentX, startY, subjectWidth, rowHeight).stroke();

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(
                    "Subjects",
                    currentX,
                    startY + 8,
                    {
                        width: subjectWidth,
                        align: "center"
                    }
                );

            currentX += subjectWidth;

            examNames.forEach((exam) => {

                let span = (exam === "SA-1" || exam === "SA-2") ? 5 : 2;

                let examWidth = subColumnWidth * span;

                doc.rect(
                    currentX,
                    startY,
                    examWidth,
                    rowHeight
                ).stroke();

                doc.text(
                    exam,
                    currentX,
                    startY + 8,
                    {
                        width: examWidth,
                        align: "center"
                    }
                );

                currentX += examWidth;

                if (exam === "SA-2") {
                    doc.rect(
                        currentX,
                        startY,
                        examWidth,
                        rowHeight
                    ).stroke();

                    doc.text(
                        "Final Result",
                        currentX,
                        startY + 8,
                        {
                            width: examWidth,
                            align: "center"
                        }
                    );

                    currentX += examWidth;
                }


            });

            // ============================================
            // HEADER ROW 2
            // ============================================

            startY += rowHeight;

            currentX = doc.page.margins.left;

            doc.rect(
                currentX,
                startY,
                subjectWidth,
                rowHeight
            ).stroke();

            currentX += subjectWidth;

            examNames.forEach((exam) => {

                if (exam === "SA-1" || exam === "SA-2") {

                    ["2FAs Avg", "Marks", "Total", "Grade", "GPA"]
                        .forEach((label) => {

                            if (exam === "SA-2") {
                                if (label === "2FAs Avg") {
                                    label = "4FAs Avg";
                                }

                            }
                            doc.rect(
                                currentX,
                                startY,
                                subColumnWidth,
                                rowHeight
                            ).stroke();

                            doc.text(
                                label,
                                currentX,
                                startY + 8,
                                {
                                    width: subColumnWidth,
                                    align: "center"
                                }
                            );

                            currentX += subColumnWidth;

                        });



                    if (exam === "SA-2") {
                        ["Comments"]
                            .forEach((label) => {
                                const mergedWidth = subColumnWidth * 5;

                                // One merged rectangle across 5 columns
                                doc.rect(currentX, startY, mergedWidth, rowHeight).stroke();
                                doc.text(
                                    label,
                                    currentX,
                                    startY + 8,
                                    {
                                        width: mergedWidth,
                                        align: "center"
                                    }
                                );


                                currentX += subColumnWidth;

                            });
                    }

                } else {

                    ["Marks", "Grade"]
                        .forEach((label) => {

                            doc.rect(
                                currentX,
                                startY,
                                subColumnWidth,
                                rowHeight
                            ).stroke();

                            doc.text(
                                label,
                                currentX,
                                startY + 8,
                                {
                                    width: subColumnWidth,
                                    align: "center"
                                }
                            );

                            currentX += subColumnWidth;

                        });

                }

            });

            // ============================================
            // TOTAL OBJECTS
            // ============================================

            const examTotals = {};
            const examMarksLimitTotals = {};
            const examTotalAvg = {};
            const examTotalmarks = {};

            examNames.forEach((exam) => {
                examTotals[exam] = 0;
                examMarksLimitTotals[exam] = 0;
                examTotalAvg[exam] = 0;
                examTotalmarks[exam] = 0;
            });

            // ============================================
            // SUBJECT ROWS
            // ============================================

            startY += rowHeight;
            let fail_exist = false;
            let subject_index = 0;
            let subject_length = Object.keys(subjects).length || 0;

            Object.keys(subjects).forEach((subject) => {

                currentX = doc.page.margins.left;

                // Subject Name
                doc.rect(currentX, startY, subjectWidth, rowHeight).stroke();

                doc.font("Helvetica").text(subject, currentX + 5, startY + 7);

                currentX += subjectWidth;

                // ============================================
                // EXAM LOOP
                // ============================================

                let sumofmarks = 0;
                let sumofmarkslimit = 0;

                examNames.forEach((exam) => {

                    const examData = subjects[subject][exam] || {};

                    const marks = Number(examData?.marks || 0);

                    const marksLimit = Number(examData?.marksLimit || 0);


                    examTotals[exam] += marks;
                    sumofmarks += marks || 0;
                    sumofmarkslimit += marksLimit;
                    let avg = 0;
                    let avglimit = 0;
                    if (exam === "SA-1" || exam === "SA-2") {
                        sumofmarks -= marks || 0;
                        sumofmarkslimit -= marksLimit || 0;

                        if (exam === "SA-1") {
                            avg = sumofmarks / 2;
                            avglimit = (sumofmarkslimit / 2);
                        } else if (exam === "SA-2") {
                            avg = sumofmarks / 4;
                            avglimit = (sumofmarkslimit / 4);
                        }

                        avg = Number(avg.toFixed(0));
                        examTotalAvg[exam] += avg;



                        avglimit = Number(avglimit.toFixed(0));
                        avglimit += marksLimit;
                        examMarksLimitTotals[exam] += avglimit;
                        // ============================================
                        // AVG CELL
                        // ============================================

                        doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                        doc.text(
                            // `${marks}/${marksLimit}`,
                            `${avg}`,
                            currentX,
                            startY + 7,
                            {
                                width: subColumnWidth,
                                align: "center",
                            }
                        );

                        currentX += subColumnWidth;



                    } else {
                        examMarksLimitTotals[exam] += marksLimit;
                    }





                    // ============================================
                    // MARKS CELL
                    // ============================================

                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                    doc.text(
                        // `${marks}/${marksLimit}`,
                        `${marks}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;

                    let totalmarks = 0;
                    if (exam === "SA-1" || exam === "SA-2") {
                        // ============================================
                        // TOTAL CELL
                        // ============================================
                        totalmarks = marks + avg;

                        examTotalmarks[exam] += totalmarks;



                        doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                        doc.text(
                            // `${marks}/${marksLimit}`,
                            `${totalmarks}`,
                            currentX,
                            startY + 7,
                            {
                                width: subColumnWidth,
                                align: "center",
                            }
                        );

                        currentX += subColumnWidth;

                    }


                    // ============================================
                    // GRADE LOGIC
                    // ============================================

                    let marks_per = 0;

                    if (marksLimit > 0) {
                        marks_per = (marks / marksLimit) * 100;
                        if (exam === "SA-1" || exam === "SA-2") {
                            marks_per = (totalmarks / avglimit) * 100;
                        }
                    }

                    let filtered_gradeData = gradeData.filter(
                        (item) => item.marks_min <= marks && item.marks_limit == 20
                    );
                    if (exam === "SA-1" || exam === "SA-2") {
                        filtered_gradeData = gradeData.filter(
                            (item) => item.marks_min <= totalmarks && item.marks_limit == 100
                        );
                        console.log("filtered_gradeData", filtered_gradeData);
                    }


                    let grade = "E";
                    let gpa = "-";

                    if (filtered_gradeData.length > 0) {
                        grade = filtered_gradeData[0]?.grade_code || "E";
                        gpa = filtered_gradeData[0]?.gpa || "-";
                    }

                    // ============================================
                    // GRADE CELL
                    // ============================================

                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                    doc.text(grade, currentX, startY + 7, {
                        width: subColumnWidth,
                        align: "center",
                    });

                    currentX += subColumnWidth;


                    if (exam === "SA-1" || exam === "SA-2") {
                        // GPA
                        doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                        doc.text(
                            `${gpa}`,
                            currentX,
                            startY + 7,
                            {
                                width: subColumnWidth,
                                align: "center",
                            }
                        );
                        currentX += subColumnWidth;
                        if (grade === "E" && exam === "SA-2") {
                            fail_exist = true;
                        }
                        if (exam === "SA-2") {
                            const mergedWidth = subColumnWidth * 5;

                            // One merged rectangle across 5 columns
                            doc.rect(currentX, startY, mergedWidth, rowHeight).stroke();

                            let exam_name = ""
                            if (subject_index === 0) { exam_name = " FA-1 :" }
                            if (subject_index === 1) { exam_name = " FA-2 :" }
                            if (subject_index === 2) { exam_name = " SA-1 :" }
                            if (subject_index === 3) { exam_name = " FA-3 :" }
                            if (subject_index === 4) { exam_name = " FA-4 :" }
                            if (subject_index === 5 && subject_length === 5) { exam_name = "SA-5 :" }


                            doc.text(
                                exam_name,
                                currentX,
                                startY + 7,
                                {
                                    width: mergedWidth,
                                    align: "left",
                                }
                            );


                            if (subject_length == (subject_index + 1)) {
                                // doc.text(
                                //     "Avg",
                                //     currentX,
                                //     startY + 7,
                                //     {
                                //         width: mergedWidth,
                                //         align: "center",
                                //     }
                                // );
                                if (exam === "SA-2") {
                                    ["4FAs Avg", "Marks", "Total", "Grade", "GPA"]
                                        .forEach((label) => {

                                            doc.rect(
                                                currentX,
                                                startY,
                                                subColumnWidth,
                                                rowHeight
                                            ).stroke();

                                            doc.font("Helvetica-Bold")
                                                .text(
                                                    label,
                                                    currentX,
                                                    startY + 8,
                                                    {
                                                        width: subColumnWidth,
                                                        align: "center"
                                                    }
                                                );

                                            currentX += subColumnWidth;

                                        });
                                }
                            }

                            // Move currentX by 5 columns
                            currentX += mergedWidth;


                            subject_index++;
                        }
                    }
                });

                startY += rowHeight;

                // ============================================
                // PAGE BREAK
                // ============================================

                if (
                    startY >
                    doc.page.height -
                    doc.page.margins.bottom -
                    100
                ) {

                    doc.addPage();

                    startY = 50;
                }
            });

            // ============================================
            // TOTAL ROW
            // ============================================

            currentX = doc.page.margins.left;

            doc.rect(currentX, startY, subjectWidth, rowHeight).stroke();

            doc
                .font("Helvetica-Bold")
                .text("Total", currentX + 5, startY + 7);

            currentX += subjectWidth;

            examNames.forEach((exam) => {


                if (exam === "SA-1" || exam === "SA-2") {
                    // ============================================
                    // TOTAL AVG CELL
                    // ============================================
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${examTotalAvg[exam]}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;


                }



                // ============================================
                // TOTAL MARKS CELL
                // ============================================

                doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                doc.text(
                    `${examTotals[exam]}`,
                    currentX,
                    startY + 7,
                    {
                        width: subColumnWidth,
                        align: "center",
                    }
                );

                currentX += subColumnWidth;

                if (exam === "SA-1" || exam === "SA-2") {

                    //Total 
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${examTotalmarks[exam]}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;


                }

                // ============================================
                // TOTAL GRADE
                // ============================================
                let totalPercentage = 0;
                let totalMarksLimit = 0;

                if (examMarksLimitTotals[exam] > 0) {
                    if (exam === "SA-1" || exam === "SA-2") {
                        totalMarksLimit = 100 * subjectLength;
                        totalPercentage =
                            (examTotalmarks[exam] / totalMarksLimit) * 100;
                    } else {
                        totalMarksLimit = 20 * subjectLength;
                        totalPercentage =
                            (examTotals[exam] / totalMarksLimit) * 100;
                    }


                    totalPercentage = Number(totalPercentage.toFixed(0));
                }



                const filtered_gradeData = gradeData.filter(
                    (item) => item.marks_min <= totalPercentage
                );



                let totalGrade = "E";
                let totalGpa = "-";

                if (filtered_gradeData.length > 0) {
                    totalGrade =
                        filtered_gradeData[0]?.grade_code || "E";
                    totalGpa =
                        filtered_gradeData[0]?.gpa || "-";


                    totalGrade = `${totalGrade}(${totalPercentage}%) (${totalMarksLimit})`;
                    if (fail_exist && exam === "SA-2") {
                        totalGrade = "-";
                        totalGpa = "-"

                    }
                }

                doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                doc.text(
                    // `${totalGrade}(${totalPercentage}%) (${totalMarksLimit})`,
                    `${totalGrade}`,
                    currentX, startY + 7, {
                    width: subColumnWidth,
                    align: "center",
                });

                currentX += subColumnWidth;


                if (exam === "SA-1" || exam === "SA-2") {

                    //GPA 
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${totalGpa}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;
                }


                if (exam === "SA-2") {
                    // TOTAL AVG CELL
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${examTotalAvg[exam]}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );
                    currentX += subColumnWidth;

                    // TOTAL MARKS CELL
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${examTotals[exam]}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;

                    //Total 
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${examTotalmarks[exam]}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;


                    //Grade
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();

                    doc.text(
                        `${totalGrade}`,
                        currentX, startY + 7, {
                        width: subColumnWidth,
                        align: "center",
                    });

                    currentX += subColumnWidth;

                    //GPA 
                    doc.rect(currentX, startY, subColumnWidth, rowHeight).stroke();
                    doc.text(
                        `${totalGpa}`,
                        currentX,
                        startY + 7,
                        {
                            width: subColumnWidth,
                            align: "center",
                        }
                    );

                    currentX += subColumnWidth;


                }
            });



            //*******Attendance Summary Report */



            const working_day_obj = workingdaysData.reduce(
                (acc, item) => {
                    acc[item.month_name] = item.work_days; // June:16, July:26...
                    acc.Total += item.work_days;           // calculate total
                    return acc;
                },
                {
                    row_name: "Working Days",
                    Total: 0,
                    Percentage: 100
                }
            );


            const work_days = working_day_obj?.Total;




            const months = [
                "June", "July", "August", "September", "October",
                "November", "December", "January", "February", "March", "April"
            ];

            const present_day_obj = {
                row_name: "Present Days",
                ...Object.fromEntries(months.map(m => [m, 0])),
                Total: 0,
                Percentage: 100
            };

            attendanceData.forEach(item => {
                present_day_obj[item.month_name] += item.attendance_flag;
                present_day_obj.Total += item.attendance_flag;
            });



            const present_days = present_day_obj?.Total;
            const percentage = (present_days / work_days) * 100;
            present_day_obj.Percentage = Number(percentage.toFixed(0));



            const reportData = [
                working_day_obj,
                present_day_obj
            ];



            const dynamicColumns = Object.keys(
                reportData[0]
            ).filter(
                key =>
                    key !== "row_name" &&
                    key !== "Total" &&
                    key !== "Percentage"
            );

            const headers = [
                "Month Name",
                ...dynamicColumns,
                "Total",
                "%"
            ];


            // -----------------------
            // ATTENDANCE TITLE
            // -----------------------

            startY = startY + 50;

            pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            doc
                .fontSize(16)
                .font("Helvetica-Bold")
                .text(
                    "Attendance Particulars",
                    doc.page.margins.left,     // start X
                    startY,                    // Y
                    {
                        width: pageWidth,      // full page width
                        align: "center"
                    }
                );

            startY += 20;


            // -----------------------
            // TABLE SETTINGS
            // -----------------------

            let startX = 20;
            // startY = startY + 100;

            rowHeight = 28;

            pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            let firstColumnWidth = 110;
            const totalWidth = 55;
            const percentageWidth = 45;

            // Dynamic month width

            const remainingWidth =
                pageWidth -
                firstColumnWidth -
                totalWidth -
                percentageWidth;

            const monthWidth =
                remainingWidth /
                dynamicColumns.length;

            const columnWidths = [
                firstColumnWidth,
                ...dynamicColumns.map(
                    () => monthWidth
                ),
                totalWidth,
                percentageWidth
            ];

            // -----------------------
            // DRAW ROW
            // -----------------------
            let drawRow = (
                y,
                row,
                isHeader = false
            ) => {

                let currentX = startX;

                row.forEach(
                    (cell, index) => {

                        const width =
                            columnWidths[index];

                        doc
                            .rect(
                                currentX,
                                y,
                                width,
                                rowHeight
                            )
                            .stroke();

                        doc
                            .font(
                                isHeader
                                    ? "Helvetica-Bold"
                                    : "Helvetica"
                            )
                            .fontSize(9)
                            .text(
                                String(cell ?? ""),
                                currentX + 2,
                                y + 8,
                                {
                                    width: width - 4,
                                    align: "center"
                                }
                            );

                        currentX += width;
                    }
                );
            };

            // -----------------------
            // HEADER
            // -----------------------

            drawRow(
                startY,
                headers,
                true
            );

            startY += rowHeight;

            // -----------------------
            // DATA
            // -----------------------

            reportData.forEach(
                rowData => {

                    if (
                        startY >
                        doc.page.height - 60
                    ) {

                        doc.addPage();

                        startY = 50;

                        drawRow(
                            startY,
                            headers,
                            true
                        );

                        startY += rowHeight;
                    }

                    const row = [
                        rowData.row_name,

                        ...dynamicColumns.map(
                            month =>
                                rowData[month] ?? "-"
                        ),

                        rowData.Total ?? 0,
                        rowData.Percentage ?? 0
                    ];

                    drawRow(
                        startY,
                        row
                    );

                    startY += rowHeight;
                }
            );


            //********Nature of Assement*****
            const nature_of_assementData = [
                {
                    nature_of_assement: "Signature of Class Teacher",
                    "FA-1": "",
                    "FA-2": "",
                    "SA-1": "",
                    "FA-3": "",
                    "FA-4": "",
                    "SA-2": "",
                },
                {
                    nature_of_assement: "Signature of Principal",
                    "FA-1": "",
                    "FA-2": "",
                    "SA-1": "",
                    "FA-3": "",
                    "FA-4": "",
                    "SA-2": "",
                },
                {
                    nature_of_assement: "Signature of Parent",
                    "FA-1": "",
                    "FA-2": "",
                    "SA-1": "",
                    "FA-3": "",
                    "FA-4": "",
                    "SA-2": "",
                }
            ];

            const examColumns = Object.keys(
                nature_of_assementData[0]
            ).filter(
                key => key !== "nature_of_assement"
            );


            // -----------------------------------
            // TITLE
            // -----------------------------------

            startY += rowHeight;

            doc
                .fontSize(16)
                .font("Helvetica-Bold")
                .text(
                    "Signature Particulars",
                    doc.page.margins.left,     // start X
                    startY,                    // Y
                    {
                        width: pageWidth,      // full page width
                        align: "center"
                    }
                );

            // startY += 80;
            startY += 20;

            // -----------------------------------
            // TABLE SETTINGS
            // -----------------------------------

            pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            firstColumnWidth = 220;

            const otherWidth =
                (pageWidth - firstColumnWidth) /
                examColumns.length;

            rowHeight = 40;

            // -----------------------------------
            // DRAW ROW
            // -----------------------------------

            drawRow = (
                y,
                row,
                isHeader = false
            ) => {

                let currentX =
                    doc.page.margins.left;

                row.forEach(
                    (cell, index) => {

                        const width =
                            index === 0
                                ? firstColumnWidth
                                : otherWidth;

                        doc
                            .rect(
                                currentX,
                                y,
                                width,
                                rowHeight
                            )
                            .stroke();

                        doc
                            .font(
                                isHeader
                                    ? "Helvetica-Bold"
                                    : "Helvetica"
                            )
                            .fontSize(10)
                            .text(
                                String(cell ?? ""),
                                currentX + 4,
                                y + 12,
                                {
                                    width: width - 8,
                                    align: "center"
                                }
                            );

                        currentX += width;
                    }
                );
            };


            // -----------------------------------
            // HEADER
            // -----------------------------------

            drawRow(
                startY,
                [
                    "Nature of Assement",
                    ...examColumns
                ],
                true
            );

            startY += rowHeight;

            // -----------------------------------
            // DATA ROWS
            // -----------------------------------

            nature_of_assementData.forEach((item) => {

                const row = [

                    item.nature_of_assement,

                    ...examColumns.map(
                        exam => item[exam]
                    )
                ];

                drawRow(startY, row);

                startY += rowHeight;

            });

            //************* */

            // ============================================
            // END PDF
            // ============================================

            doc.end();



        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Error generating Progress Card",
            });
        }
    },

    generateGraphReport: async (req, res) => {
        try {

            // const PDFDocument = require("pdfkit");

            const doc = new PDFDocument({
                size: "A3",
                layout: "landscape",
                margin: 20
            });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'inline; filename="SA-2-Graph-Report.pdf"'
            );

            doc.pipe(res);

            // ---------------- SAMPLE DATA ----------------

            const schoolId = req.user.schoolId;

            const filterQuery = {};
            filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);



            if (req.query?.class) {
                filterQuery.student_class = req.query?.class;
            }
            if (req.query?.section) {
                filterQuery.section = req.query?.section;
            }
            if (req.query?.student) {
                filterQuery._id = new mongoose.Types.ObjectId(req.query?.student);
            }

            const studentsData = await Student.find(filterQuery).populate("student_class").populate("section")
                .sort({ roll_no: 1 }).lean();
            console.log("studentsData", studentsData);

            let class_name = "";
            let section_name = "";
            if (studentsData.length>0){
                class_name = studentsData[0]?.class?.class_name||"";
                section_name = studentsData[0]?.class?.section_name||"";
            }

            let year_name = "";
            if (req.query?.year) {
                filterQuery.year = req.query?.year;
                year_name = req.query?.year_name||"";
            }
            if (req.query?.class) {
                if (filterQuery.student_class) {
                    delete filterQuery.student_class;
                }
                filterQuery.class = req.query?.class;
            }

            if (filterQuery._id) {
                delete filterQuery._id;
            }
            if (req.query?.student) {
                filterQuery.student = new mongoose.Types.ObjectId(req.query?.student);
            }

            const marksheetData = await Marksheetdetail.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("examination")
                .populate("subject")
                .populate("student")
                .sort({ examination: 1 })
                .lean();

            const gradeData = await Grade.find({ school: schoolId })
                .sort({ marks_min: -1 })
                .lean();

            let subjectsData = await Classsubject.find({
                school: schoolId,
                class: req.query?.class
            })
                .populate({
                    path: "subject",
                    select: "subject_name -_id"
                })
                .select("subject")
                .sort({ seq: 1 })
                .lean();

            if (subjectsData.length == 0) {
                subjectsData = await Subject.find({ school: schoolId })
                    .select("subject_name -_id")
                    .sort({ seq: 1 })
                    .lean();
            }


            const examsData = await Examination.find({ school: schoolId })
                .select("examination_name -_id")
                .sort({ seq: 1 })
                .lean();


            const reportHeader = {
                school_name: marksheetData[0].school.school_name,
                address: marksheetData[0].school.address,
                city: marksheetData[0].school.city,
                state: marksheetData[0].school.state,
                country: marksheetData[0].school.country,
                class: marksheetData[0].class.class_name,
                section: marksheetData[0].section.section_name,
                student: marksheetData[0].student.name,
                school_image: marksheetData[0].school.school_image
            };

            let reportData = [];
            let obj_student = {}

            studentsData.forEach(item => {

                const student_id = String(item?._id).trim();

                const student_marksheet_data = marksheetData.filter(marksheet => {
                    return marksheet?.student?._id.toString() === student_id;
                });

                const tableData = transformMarksheetData(student_marksheet_data, subjectsData, examsData);

                const examNames = tableData.exams;
                const subjects = tableData.subjects;



                const subjectLength = Object.keys(subjects).length;
                console.log(subjectLength); // 3


                const examTotals = {};
                const examMarksLimitTotals = {};
                const examTotalAvg = {};
                const examTotalmarks = {};

                examNames.forEach((exam) => {
                    examTotals[exam] = 0;
                    examMarksLimitTotals[exam] = 0;
                    examTotalAvg[exam] = 0;
                    examTotalmarks[exam] = 0;
                });

                // ============================================
                // SUBJECT ROWS
                // ============================================

                let fail_exist = false;
                let subject_index = 0;
                let subject_length = Object.keys(subjects).length || 0;

                Object.keys(subjects).forEach((subject) => {



                    // ============================================
                    // EXAM LOOP
                    // ============================================

                    let sumofmarks = 0;
                    let sumofmarkslimit = 0;

                    examNames.forEach((exam) => {

                        const examData = subjects[subject][exam] || {};

                        const marks = Number(examData?.marks || 0);

                        const marksLimit = Number(examData?.marksLimit || 0);


                        examTotals[exam] += marks;
                        sumofmarks += marks || 0;
                        sumofmarkslimit += marksLimit;
                        let avg = 0;
                        let avglimit = 0;
                        if (exam === "SA-1" || exam === "SA-2") {
                            sumofmarks -= marks || 0;
                            sumofmarkslimit -= marksLimit || 0;

                            if (exam === "SA-1") {
                                avg = sumofmarks / 2;
                                avglimit = (sumofmarkslimit / 2);
                            } else if (exam === "SA-2") {
                                avg = sumofmarks / 4;
                                avglimit = (sumofmarkslimit / 4);
                            }

                            avg = Number(avg.toFixed(0));
                            examTotalAvg[exam] += avg;



                            avglimit = Number(avglimit.toFixed(0));
                            avglimit += marksLimit;
                            examMarksLimitTotals[exam] += avglimit;
                            // ============================================
                            // AVG CELL
                            // ============================================





                        } else {
                            examMarksLimitTotals[exam] += marksLimit;
                        }





                        // ============================================
                        // MARKS CELL
                        // ============================================



                        let totalmarks = 0;
                        if (exam === "SA-1" || exam === "SA-2") {
                            // ============================================
                            // TOTAL CELL
                            // ============================================
                            totalmarks = marks + avg;

                            examTotalmarks[exam] += totalmarks;





                        }


                        // ============================================
                        // GRADE LOGIC
                        // ============================================

                        let marks_per = 0;

                        if (marksLimit > 0) {
                            marks_per = (marks / marksLimit) * 100;
                            if (exam === "SA-1" || exam === "SA-2") {
                                marks_per = (totalmarks / avglimit) * 100;
                            }
                        }

                        let filtered_gradeData = gradeData.filter(
                            (item) => item.marks_min <= marks && item.marks_limit == 20
                        );
                        if (exam === "SA-1" || exam === "SA-2") {
                            filtered_gradeData = gradeData.filter(
                                (item) => item.marks_min <= totalmarks && item.marks_limit == 100
                            );
                            console.log("filtered_gradeData", filtered_gradeData);
                        }


                        let grade = "E";
                        let gpa = "-";

                        if (filtered_gradeData.length > 0) {
                            grade = filtered_gradeData[0]?.grade_code || "E";
                            gpa = filtered_gradeData[0]?.gpa || "-";
                        }




                        if (exam === "SA-1" || exam === "SA-2") {
                            // GPA

                            if (grade === "E" && exam === "SA-2") {
                                fail_exist = true;
                            }

                        }
                    });




                });


                let totalPercentage = 0;
                examNames.forEach((exam) => {
                    // ============================================
                    // TOTAL GRADE
                    // ============================================
                    // let totalPercentage = 0;
                    let totalMarksLimit = 0;

                    if (examMarksLimitTotals[exam] > 0) {
                        if (exam === "SA-1" || exam === "SA-2") {
                            totalMarksLimit = 100 * subjectLength;
                            totalPercentage =
                                (examTotalmarks[exam] / totalMarksLimit) * 100;
                        } else {
                            totalMarksLimit = 20 * subjectLength;
                            totalPercentage =
                                (examTotals[exam] / totalMarksLimit) * 100;
                        }


                        totalPercentage = Number(totalPercentage.toFixed(0));
                    }



                    const filtered_gradeData = gradeData.filter(
                        (item) => item.marks_min <= totalPercentage
                    );



                    let totalGrade = "E";
                    let totalGpa = "-";

                    if (filtered_gradeData.length > 0) {
                        totalGrade =
                            filtered_gradeData[0]?.grade_code || "E";
                        totalGpa =
                            filtered_gradeData[0]?.gpa || "-";


                        totalGrade = `${totalGrade}(${totalPercentage}%) (${totalMarksLimit})`;
                        if (fail_exist && exam === "SA-2") {
                            totalGrade = "-";
                            totalGpa = "-"

                        }
                    }


                });

                obj_student = {
                    roll: item?.roll_no || 0,
                    name: item?.name,
                    percentage: totalPercentage
                }
                reportData.push(obj_student);

            });


            

            // ---------------- WHITE BACKGROUND ----------------

            doc.rect(
                0,
                0,
                doc.page.width,
                doc.page.height
            )
                .fill("#FFFFFF");


            // ============================================
            // SCHOOL LOGO
            // ============================================

            if (reportHeader?.school_image) {

                try {

                    const img = await axios.get(
                        reportHeader.school_image,
                        {
                            responseType: "arraybuffer"
                        }
                    );

                    doc.image(img.data, 30, 20, {
                        width: 60,
                    });

                } catch (err) {

                    console.log("Logo load failed");
                }
            }

            // ---------------- TITLE ----------------
            doc.fillColor("black")
                .fontSize(18)
                .text(
                    "STUDENT PERCENTAGE REPORT " + year_name,
                    0,
                    30,
                    { align: "center" }
                );


            doc.font("Helvetica-Bold")
                .text(
                    "Class :",
                    50,
                    100
                );

            doc.font("Helvetica")
                .text(
                    reportHeader.class,
                    120,
                    100
                );

            doc.font("Helvetica-Bold")
                .text(
                    "Section :",
                    400,
                    100
                );

            doc.font("Helvetica")
                .text(
                    reportHeader.section,
                    490,
                    100
                );


            // ---------------- TABLE ----------------

            // let startX = 30;
            let startX = 50;
            // let startY = 70;
            let startY = 130;

            let rollWidth = 50;
            let nameWidth = 250;
            let percentWidth = 100;
            let rowHeight = 22;

            doc.lineWidth(1);

            // Header

            drawCell(
                startX,
                startY,
                rollWidth,
                rowHeight,
                "ROLL"
            );

            drawCell(
                startX + rollWidth,
                startY,
                nameWidth,
                rowHeight,
                "NAME OF STUDENT"
            );

            drawCell(
                startX + rollWidth + nameWidth,
                startY,
                percentWidth,
                rowHeight,
                "%"
            );

            startY += rowHeight;

            // Rows

            reportData.forEach((row) => {

                drawCell(
                    startX,
                    startY,
                    rollWidth,
                    rowHeight,
                    row.roll.toString()
                );

                drawCell(
                    startX + rollWidth,
                    startY,
                    nameWidth,
                    rowHeight,
                    row.name
                );

                drawCell(
                    startX + rollWidth + nameWidth,
                    startY,
                    percentWidth,
                    rowHeight,
                    row.percentage.toFixed(2)
                );

                startY += rowHeight;

            });

            // ---------------- GRAPH ----------------

            const chartX = 70;
            const chartY = startY + 60;
            const chartWidth = 700;
            const chartHeight = 200;

            // Graph Border

            doc.strokeColor("black")
                .rect(
                    chartX - 20,
                    chartY - 20,
                    chartWidth + 60,
                    chartHeight + 120
                )
                .stroke();

            // Graph Title

            doc.fillColor("black")
                .fontSize(12)
                .text(
                    "% vs NAME OF THE STUDENT",
                    chartX,
                    chartY - 45
                );

            // Y Axis

            doc.strokeColor("black")
                .moveTo(chartX, chartY)
                .lineTo(chartX, chartY + chartHeight)
                .stroke();

            // X Axis

            doc.moveTo(
                chartX,
                chartY + chartHeight
            )
                .lineTo(
                    chartX + chartWidth,
                    chartY + chartHeight
                )
                .stroke();

            // Grid Lines

            [0, 25, 50, 75, 100].forEach(val => {

                let gy =
                    chartY +
                    chartHeight -
                    (val / 100) * chartHeight;

                doc.strokeColor("#999999")
                    .moveTo(chartX, gy)
                    .lineTo(
                        chartX + chartWidth,
                        gy
                    )
                    .stroke();

                doc.fillColor("black")
                    .fontSize(8)
                    .text(
                        val.toString(),
                        chartX - 25,
                        gy - 5
                    );

            });

            // Bars

            let barWidth = 14;
            let gap = 12;

            reportData.forEach((row, index) => {

                let x =
                    chartX +
                    20 +
                    index * (barWidth + gap);

                let barHeight =
                    (row.percentage / 100)
                    * chartHeight;

                let y =
                    chartY +
                    chartHeight -
                    barHeight;

                // Pink Bar

                doc.fillColor("#d56db6")
                    .rect(
                        x,
                        y,
                        barWidth,
                        barHeight
                    )
                    .fill();

                // Rotated Labels

                doc.save();

                doc.rotate(
                    -45,
                    {
                        origin: [
                            x,
                            chartY +
                            chartHeight +
                            20
                        ]
                    }
                );

                doc.fillColor("black")
                    .fontSize(7)
                    .text(
                        row.name,
                        x,
                        chartY +
                        chartHeight +
                        20,
                        {
                            width: 90
                        }
                    );

                doc.restore();

            });

            // X Axis Title

            doc.fillColor("black")
                .fontSize(10)
                .text(
                    "NAME OF THE STUDENT",
                    chartX + 220,
                    chartY + chartHeight + 85
                );

            doc.end();

            // ---------- CELL FUNCTION ----------

            function drawCell(
                x,
                y,
                width,
                height,
                text
            ) {

                doc.strokeColor("black")
                    .rect(
                        x,
                        y,
                        width,
                        height
                    )
                    .stroke();

                doc.fillColor("black")
                    .fontSize(9)
                    .text(
                        text,
                        x + 5,
                        y + 6,
                        {
                            width: width - 10
                        }
                    );
            }

        }
        catch (err) {

            console.log(err);

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    },
    generateGraphReport_Orig: async (req, res) => {
        try {

            // const PDFDocument = require("pdfkit");

            const doc = new PDFDocument({
                size: "A3",
                layout: "landscape",
                margin: 20
            });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'inline; filename="SA-2-Graph-Report.pdf"'
            );

            doc.pipe(res);

            // ---------------- SAMPLE DATA ----------------

            const reportData = [
                { roll: 1, name: "Abdul Azeez", percentage: 65.41 },
                { roll: 2, name: "Abdul Rahman", percentage: 82.08 },
                { roll: 3, name: "Anware Ahmedi", percentage: 43.75 },
                { roll: 4, name: "Alveena Firdose", percentage: 81.04 },
                { roll: 5, name: "Ameer Hamza", percentage: 95.62 },
                { roll: 6, name: "Anabiya Nabi", percentage: 25.41 },
                { roll: 7, name: "Mohammed Anas", percentage: 44.16 },
                { roll: 8, name: "Mohammed Farhan", percentage: 83.33 },
                { roll: 9, name: "Hafsa Fatima", percentage: 87.08 },
                { roll: 10, name: "Iram Khan", percentage: 44.58 },
                { roll: 11, name: "Mohammed Jawaad", percentage: 49.16 },
                { roll: 12, name: "Madiha Amjad", percentage: 83.95 }
            ];

            // ---------------- WHITE BACKGROUND ----------------

            doc.rect(
                0,
                0,
                doc.page.width,
                doc.page.height
            )
                .fill("#FFFFFF");

            // ---------------- TITLE ----------------

            doc.fillColor("black")
                .fontSize(18)
                .text(
                    "SA-2 GRAPH REPORT 2025-26",
                    0,
                    20,
                    { align: "center" }
                );

            // ---------------- TABLE ----------------

            let startX = 30;
            let startY = 70;

            let rollWidth = 50;
            let nameWidth = 250;
            let percentWidth = 100;
            let rowHeight = 22;

            doc.lineWidth(1);

            // Header

            drawCell(
                startX,
                startY,
                rollWidth,
                rowHeight,
                "ROLL"
            );

            drawCell(
                startX + rollWidth,
                startY,
                nameWidth,
                rowHeight,
                "NAME OF STUDENT"
            );

            drawCell(
                startX + rollWidth + nameWidth,
                startY,
                percentWidth,
                rowHeight,
                "%"
            );

            startY += rowHeight;

            // Rows

            reportData.forEach((row) => {

                drawCell(
                    startX,
                    startY,
                    rollWidth,
                    rowHeight,
                    row.roll.toString()
                );

                drawCell(
                    startX + rollWidth,
                    startY,
                    nameWidth,
                    rowHeight,
                    row.name
                );

                drawCell(
                    startX + rollWidth + nameWidth,
                    startY,
                    percentWidth,
                    rowHeight,
                    row.percentage.toFixed(2)
                );

                startY += rowHeight;

            });

            // ---------------- GRAPH ----------------

            const chartX = 70;
            const chartY = startY + 60;
            const chartWidth = 700;
            const chartHeight = 200;

            // Graph Border

            doc.strokeColor("black")
                .rect(
                    chartX - 20,
                    chartY - 20,
                    chartWidth + 60,
                    chartHeight + 120
                )
                .stroke();

            // Graph Title

            doc.fillColor("black")
                .fontSize(12)
                .text(
                    "% vs NAME OF THE STUDENT",
                    chartX,
                    chartY - 45
                );

            // Y Axis

            doc.strokeColor("black")
                .moveTo(chartX, chartY)
                .lineTo(chartX, chartY + chartHeight)
                .stroke();

            // X Axis

            doc.moveTo(
                chartX,
                chartY + chartHeight
            )
                .lineTo(
                    chartX + chartWidth,
                    chartY + chartHeight
                )
                .stroke();

            // Grid Lines

            [0, 25, 50, 75, 100].forEach(val => {

                let gy =
                    chartY +
                    chartHeight -
                    (val / 100) * chartHeight;

                doc.strokeColor("#999999")
                    .moveTo(chartX, gy)
                    .lineTo(
                        chartX + chartWidth,
                        gy
                    )
                    .stroke();

                doc.fillColor("black")
                    .fontSize(8)
                    .text(
                        val.toString(),
                        chartX - 25,
                        gy - 5
                    );

            });

            // Bars

            let barWidth = 14;
            let gap = 12;

            reportData.forEach((row, index) => {

                let x =
                    chartX +
                    20 +
                    index * (barWidth + gap);

                let barHeight =
                    (row.percentage / 100)
                    * chartHeight;

                let y =
                    chartY +
                    chartHeight -
                    barHeight;

                // Pink Bar

                doc.fillColor("#d56db6")
                    .rect(
                        x,
                        y,
                        barWidth,
                        barHeight
                    )
                    .fill();

                // Rotated Labels

                doc.save();

                doc.rotate(
                    -45,
                    {
                        origin: [
                            x,
                            chartY +
                            chartHeight +
                            20
                        ]
                    }
                );

                doc.fillColor("black")
                    .fontSize(7)
                    .text(
                        row.name,
                        x,
                        chartY +
                        chartHeight +
                        20,
                        {
                            width: 90
                        }
                    );

                doc.restore();

            });

            // X Axis Title

            doc.fillColor("black")
                .fontSize(10)
                .text(
                    "NAME OF THE STUDENT",
                    chartX + 220,
                    chartY + chartHeight + 85
                );

            doc.end();

            // ---------- CELL FUNCTION ----------

            function drawCell(
                x,
                y,
                width,
                height,
                text
            ) {

                doc.strokeColor("black")
                    .rect(
                        x,
                        y,
                        width,
                        height
                    )
                    .stroke();

                doc.fillColor("black")
                    .fontSize(9)
                    .text(
                        text,
                        x + 5,
                        y + 6,
                        {
                            width: width - 10
                        }
                    );
            }

        }
        catch (err) {

            console.log(err);

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    },


    getGradeListPrint: async (req, res) => {


        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            let requesttype = "";
            if (req.query.requesttype) {
                requesttype = req.query?.requesttype;
            }


            const data = await await Grade.find(filterQuery)
                .populate("school")
                .lean();



            if (requesttype === "PDF") {


                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape", // ✅ IMPORTANT
                    margin: 30
                });




                // ✅ SET HEADERS BEFORE PIPE
                res.writeHead(200, {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=gradelist.pdf"
                });

                doc.pipe(res);



                const schoolInfo = data[0]?.school || {};
                // Logo (IMPORTANT)
                // -----------------------------
                // 🏫 HEADER LAYOUT
                // -----------------------------

                const logoX = 40;
                const logoY = 30;
                const logoWidth = 50;

                const textStartX = logoX + logoWidth + 15; // 👉 right of logo
                const textWidth = 400;

                // Logo
                if (schoolInfo?.school_image) {
                    try {
                        const img = await axios.get(schoolInfo.school_image, {
                            responseType: "arraybuffer"
                        });

                        doc.image(img.data, logoX, logoY, {
                            width: logoWidth,
                            height: 50
                        });
                    } catch (err) {
                        console.log("Logo load failed");
                    }
                }

                if (data.length == 0) {
                    // No Data Found (bold)
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(14)
                        .text(
                            "No Data Found",
                            textStartX,
                            logoY,
                            {
                                width: textWidth,
                                align: "center"
                            }
                        );
                    doc.end();
                    return;
                }

                // School Name (bold)
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        schoolInfo.school_name || "School Name",
                        textStartX,
                        logoY,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // Address
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        `${schoolInfo.address || ""}, ${schoolInfo.city || ""}, ${schoolInfo.state || ""}`,
                        textStartX,
                        logoY + 20,
                        {
                            width: textWidth,
                            align: "left"
                        }
                    );

                // -----------------------------
                // ➖ Divider Line
                // -----------------------------
                const dividerY = logoY + 60;

                doc
                    .moveTo(40, dividerY)
                    .lineTo(doc.page.width - 40, dividerY)
                    .stroke();

                // -----------------------------
                // 📄 REPORT TITLE (with gap)
                // -----------------------------
                const titleY = dividerY + 15;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text("Grade List Report", 0, titleY, {
                        align: "center"
                    });

                let y = titleY + 25; // 👉 proper gap after title

                // -----------------------------
                // 📊 TABLE HEADER START
                // -----------------------------

                const tableWidth = doc.page.width - 80; // full width with margins


                const columns = [
                    { label: "Marks Limit", key: "marks_limit", width: tableWidth * 0.15 },
                    { label: "Marks(Min)", key: "marks_min", width: tableWidth * 0.08 },
                    { label: "Marks(Max)", key: "marks_max", width: tableWidth * 0.15 },
                    { label: "Grade", key: "grade_code", width: tableWidth * 0.12 },
                    { label: "GPA", key: "gpa", width: tableWidth * 0.12 },

                ];


                const getTextHeight = (doc, text, width) => {
                    return doc.heightOfString(text || "-", {
                        width: width - 10
                    });
                };


                const drawHeader = () => {
                    let x = 40;

                    doc.font("Helvetica-Bold").fontSize(9);

                    columns.forEach(col => {

                        // ✅ Draw background FIRST
                        doc.rect(x, y, col.width, 25).fill("#f2f2f2");

                        // ✅ Draw border AFTER
                        doc.rect(x, y, col.width, 25).stroke();

                        // ✅ Reset text color (VERY IMPORTANT)
                        doc.fillColor("black");

                        // ✅ Draw text LAST
                        doc.text(col.label, x + 5, y + 7, {
                            width: col.width - 10,
                            align: "center"
                        });

                        x += col.width;
                    });

                    y += 25;
                };


                // doc.fontSize(9);
                doc.fontSize(10);

                const drawRow = (row, index) => {

                    let x = 40;

                    // 🔥 Calculate dynamic height
                    let maxHeight = 0;

                    const values = columns.map(col => {
                        let value = "-";

                        switch (col.key) {
                            case "marks_limit":
                                value = row?.marks_limit;
                                break;
                            case "marks_max":
                                value = row?.marks_max;
                                break;
                            case "marks_min":
                                value = row?.marks_min;
                                break;
                            case "grade_code":
                                value = row?.grade_code;
                                break;
                            case "gpa":
                                value = row?.gpa;
                                break;

                        }

                        const height = getTextHeight(doc, value, col.width);
                        if (height > maxHeight) maxHeight = height;

                        return value;
                    });

                    const rowHeight = maxHeight + 10;

                    // 🔁 Page break
                    if (y + rowHeight > doc.page.height - 40) {
                        doc.addPage();
                        y = 50;
                        drawHeader();
                    }

                    // Zebra row (optional)
                    if (index % 2 === 0) {
                        doc.rect(40, y, tableWidth, rowHeight).fill("#fafafa").fillColor("black");
                    }

                    // Draw cells
                    x = 40;

                    values.forEach((value, i) => {
                        const col = columns[i];
                        // Border
                        doc.rect(x, y, col.width, rowHeight).stroke();

                        // Text (WRAPPED)
                        doc.text(value || "-", x + 5, y + 5, {
                            width: col.width - 10,
                            align: "left"
                        });

                        x += col.width;
                    });

                    y += rowHeight;
                };

                drawHeader();

                data.forEach((row, index) => {
                    drawRow(row, index);
                });

                doc.end();
            } else {
                res.status(200).json({
                    success: true,
                    data: data, // contains data
                });
            }

        } catch (err) {
            console.error(err);
            // res.status(500).send("Error generating PDF");
            console.error("Error generating Gradelist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Gradelist",
            });
        }
    },



}

const transformMarksheetData = (data, subjectsData, examsData) => {

    const subjects = {};
    const exams = new Set();

    subjectsData.forEach(item_subject => {
        let subject = item_subject?.subject_name;
        if (item_subject?.subject) {
            subject = item_subject?.subject?.subject_name;
        }

        examsData.forEach(item_exam => {
            const exam = item_exam?.examination_name;
            exams.add(exam);

            if (!subjects[subject]) {
                subjects[subject] = {};
            }
            subjects[subject][exam] = {
                marks: 0,
                marksLimit: 0
            };

        });
    });

    data.forEach(item => {
        const subject = item.subject.subject_name || item.subject;
        const exam = item.examination.examination_name || item.examination;

        exams.add(exam);

        if (!subjects[subject]) {
            subjects[subject] = {};
        }

        subjects[subject][exam] = {
            marks: item?.marks || 0,
            marksLimit: item?.marksLimit || 0
        };
    });

    return {
        exams: Array.from(exams),
        subjects
    };
};

const transformMarksheetData_Orig = (data) => {

    const subjects = {};
    const exams = new Set();

    data.forEach(item => {
        const subject = item.subject.subject_name || item.subject;
        const exam = item.examination.examination_name || item.examination;

        exams.add(exam);

        if (!subjects[subject]) {
            subjects[subject] = {};
        }

        subjects[subject][exam] = {
            marks: item?.marks || 0,
            marksLimit: item?.marksLimit || 0
        };
    });

    return {
        exams: Array.from(exams),
        subjects
    };
};



