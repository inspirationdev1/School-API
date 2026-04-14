require("dotenv").config();
const mongoose = require("mongoose");
const Marksheet = require("../model/marksheet.model");
const Marksheetdetail = require("../model/marksheetdetail.model");
const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");
const Expense = require("../model/expense.model");
const Expensedetail = require("../model/expensedetail.model");

const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");

const Payment = require("../model/payment.model");
const Paymentdetail = require("../model/paymentdetail.model");

const Attendance = require("../model/attendance.model");

const Period = require("../model/period.model");



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
}