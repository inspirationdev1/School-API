require("dotenv").config();
const axios = require("axios");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const Marksheet = require("../model/marksheet.model");
const Marksheetdetail = require("../model/marksheetdetail.model");
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
    getProgressCardPrint: async (req, res) => {
        try {
            // const id = req.params.id;



            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);

            if (req.query.hasOwnProperty('student')) {
                const studentId = req.query.student;
                filterQuery['student'] = new mongoose.Types.ObjectId(studentId);
            }

            if (req.query.hasOwnProperty('year')) {
                const year = req.query.year;
                filterQuery['year'] = year;
            }

            filterQuery['status'] = "valid";


            const result = await Marksheetdetail.find(filterQuery)
                .populate("school")
                .populate("class")
                .populate("section")
                .populate("teacher")
                .populate("subject")
                .populate("examination")
                .populate("questionpaper")
                .populate("student")
                .lean();
            console.log(result);

            // const result = await Marksheet.aggregate([

            //     {
            //         $match: filterQuery
            //     },

            //     // 🔹 Get marksheetDetails
            //     {
            //         $lookup: {
            //             from: "marksheetdetails",
            //             localField: "_id",
            //             foreignField: "msId",
            //             as: "marksheetDetails"
            //         }
            //     },

            //     // FILTER ARRAY HERE
            //     {
            //         $addFields: {
            //             marksheetDetails: {
            //                 $filter: {
            //                     input: "$marksheetDetails",
            //                     as: "detail",
            //                     cond: {
            //                         $eq: [
            //                             "$$detail.student",
            //                             new mongoose.Types.ObjectId(req.query.student)
            //                         ]
            //                     }
            //                 }
            //             }
            //         }
            //     },

            //     // Remove marksheets that now have empty array
            //     {
            //         $match: {
            //             "marksheetDetails.0": { $exists: true }
            //         }
            //     },
            //     // 🔹 FILTER BY STUDENT HERE
            //     {
            //         $match: {
            //             "marksheetDetails.student": new mongoose.Types.ObjectId(req.query.student)
            //         }
            //     },

            //     // 🔹 Populate students
            //     {
            //         $lookup: {
            //             from: "students",
            //             localField: "marksheetDetails.student",
            //             foreignField: "_id",
            //             as: "studentData"
            //         }
            //     },



            //     // 🔹 Merge student data into marksheetDetails
            //     {
            //         $addFields: {
            //             marksheetDetails: {
            //                 $map: {
            //                     input: "$marksheetDetails",
            //                     as: "detail",
            //                     in: {
            //                         $mergeObjects: [
            //                             "$$detail",
            //                             {
            //                                 student: {
            //                                     $arrayElemAt: [
            //                                         {
            //                                             $filter: {
            //                                                 input: "$studentData",
            //                                                 as: "s",
            //                                                 cond: {
            //                                                     $eq: ["$$s._id", "$$detail.student"]
            //                                                 }
            //                                             }
            //                                         },
            //                                         0
            //                                     ]
            //                                 }
            //                             }
            //                         ]
            //                     }
            //                 }
            //             }
            //         }
            //     },

            //     // cleanup
            //     {
            //         $project: {
            //             studentData: 0
            //         }
            //     },

            //     // 🔹 Populate school
            //     {
            //         $lookup: {
            //             from: "schools",
            //             localField: "school",
            //             foreignField: "_id",
            //             as: "school"
            //         }
            //     },
            //     { $unwind: "$school" },

            //     // 🔹 Populate class
            //     {
            //         $lookup: {
            //             from: "classes",
            //             localField: "class",
            //             foreignField: "_id",
            //             as: "class"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$class",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 Populate section
            //     {
            //         $lookup: {
            //             from: "sections",
            //             localField: "section",
            //             foreignField: "_id",
            //             as: "section"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$section",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 Populate teacher
            //     {
            //         $lookup: {
            //             from: "teachers",
            //             localField: "teacher",
            //             foreignField: "_id",
            //             as: "teacher"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$teacher",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 Populate subject
            //     {
            //         $lookup: {
            //             from: "subjects",
            //             localField: "subject",
            //             foreignField: "_id",
            //             as: "subject"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$subject",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 Populate examination
            //     {
            //         $lookup: {
            //             from: "examinations",
            //             localField: "examination",
            //             foreignField: "_id",
            //             as: "examination"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$examination",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 Populate questionpaper
            //     {
            //         $lookup: {
            //             from: "questionpapers",
            //             localField: "questionpaper",
            //             foreignField: "_id",
            //             as: "questionpaper"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$questionpaper",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     },

            //     // 🔹 SUM marks
            //     {
            //         $addFields: {
            //             totalMarks: {
            //                 $sum: "$marksheetDetails.marks"
            //             }
            //         }
            //     }

            // ]);

            if (!result.length) {
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
            console.error("Error generating Teacherlist", err.message);
            res.status(500).json({
                success: false,
                message: "Error generating Teacherlist",
            });
        }
    },
}