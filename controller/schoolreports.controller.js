require("dotenv").config();
const mongoose = require("mongoose");
const Marksheet = require("../model/marksheet.model");
const Marksheetdetail = require("../model/marksheetdetail.model");
const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");
const Expense = require("../model/expense.model");
const Expensedetail = require("../model/expensedetail.model");

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



            const result = {income: resultIncome,expense: resultExpense};
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
}