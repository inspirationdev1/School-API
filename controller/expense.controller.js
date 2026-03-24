require("dotenv").config();
const mongoose = require("mongoose");
const Expense = require("../model/expense.model");
const Expensedetail = require("../model/expensedetail.model");
const paymentdetailModel = require("../model/paymentdetail.model");


module.exports = {

    getAllExpenses: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allExpense = await Expense.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Expense", data: allExpense })
        } catch (error) {
            console.log("Error in getAllExpense", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Expense. Try later" })
        }

    },
    createExpense: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            // 1️⃣ Save expense
            const newExpense = new Expense({
                ...req.body,
                school: schoolId,
            });

            const savedData = await newExpense.save();

            // 2️⃣ Map expenseDetails
            const expDetail = req.body.expenseDetails || [];
            const expId = savedData._id || null;
            const expenseDetails = expDetail.map((item) => ({
                ...item,
                school: schoolId,
                expenseId: expId,
            }));

            // 3️⃣ Save expenseDetails
            if (expenseDetails.length > 0) {
                await Expensedetail.insertMany(expenseDetails);
            }

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Expense is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating expense:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Expense.",
            });
        }
    },
    getExpenseWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Expense.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },
                // 🧑‍💼 EMPLOYEE POPULATE
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
                {
                    $lookup: {
                        from: "expensedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "expenseId",
                        as: "expenseDetails",
                    },
                },

                {
                    $lookup: {
                        from: "expensetypes",
                        localField: "expenseDetails.expensetype",
                        foreignField: "_id",
                        as: "expenseTypeData",
                    },
                },
                {
                    $addFields: {
                        expenseDetails: {
                            $map: {
                                input: "$expenseDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            expensetype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$expenseTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.expensetype"],
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
                        expenseTypeData: 0, // cleanup
                    },
                },
                {
                    $lookup: {
                        from: "expensetypes",
                        localField: "expenseDetails.expensetype",
                        foreignField: "_id",
                        as: "expenseTypeData",
                    },
                },
                {
                    $addFields: {
                        expenseDetails: {
                            $map: {
                                input: "$expenseDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            expensetype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$expenseTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.expensetype"],
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
                        expenseTypeData: 0, // cleanup
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Expense not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains expense + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getExpenseWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Expense",
            });
        }
    }
    ,

    updateExpenseWithId: async (req, res) => {
        // Not providing the  schoolId as expense Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Expense.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map expenseDetails
            const expDetail = req.body.expenseDetails || [];
            const expId = id || null;
            const expenseDetails = expDetail.map((item) => ({
                ...item,
                school: schoolId,
                expenseId: expId,
            }));
            // 3️⃣ Save expense details
            if (expenseDetails.length > 0) {
                await Expensedetail.deleteMany({
                    expenseId: expId,
                    school: schoolId
                });

                await Expensedetail.insertMany(expenseDetails);
            }
            const ExpenseAfterUpdate = await Expense.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Expense Updated", data: ExpenseAfterUpdate })
        } catch (error) {

            console.log("Error in updateExpenseWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Expense. Try later" })
        }

    },
    deleteExpenseWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Expense.findOneAndUpdate(
                { _id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            await Expensedetail.updateMany(
                { expenseId: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            // await Expense.findOneAndDelete({ _id: id, school: schoolId });
            const ExpenseAfterDelete = await Expense.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Expense Deleted.", data: ExpenseAfterDelete })



        } catch (error) {

            console.log("Error in updateExpenseWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Expense. Try later" })
        }

    },
    getExpenseWithEmployeeId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const filterQuery = {};
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            if (req.query.hasOwnProperty('employee')) {
                const employeeId = req.query.employee;
                filterQuery['employee'] = new mongoose.Types.ObjectId(employeeId);
            }
            filterQuery['status'] = "valid";

            var result = await Expense.aggregate([
                {
                    $match: filterQuery,
                },

                {
                    $lookup: {
                        from: "expensedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "expenseId",
                        as: "expenseDetails",
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalExpenseAmount: {
                            $sum: "$expenseDetails.expenseAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Salesinvoice not found",
                });
            }

            if (result.length > 0) {

                const paymentDetails = await paymentdetailModel.aggregate([
                    { $match: filterQuery },
                    {
                        $group: {
                            _id: "$expenseId",
                            expenseCode: { $first: "$expenseCode" },
                            totalPaidAmount: { $sum: "$paidAmount" },
                            expenseDetails: { $push: "$$ROOT" }
                        }
                    }
                ]);
                if (paymentDetails.length > 0) {
                    console.log("paymentDetails:", paymentDetails);
                    for (const item of result) {
                        console.log("SI ID:", item._id);
                        console.log("Invoice Code:", item.expenseCode);
                        const expenseId = item._id;
                        const filtered = paymentDetails.filter(
                            row => row._id.toString() === expenseId.toString()
                        );
                        console.log("filtered:", filtered);
                        if (filtered.length > 0) {
                            item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
                        } else {
                            item.totalPaidAmount = 0;
                        }
                        item.balanceAmount = item.totalExpenseAmount - item.totalPaidAmount;
                    }
                    result = result.filter(
                        row => row.balanceAmount > 0
                    );
                    console.log("result:", result);

                }
            }



            res.status(200).json({
                success: true,
                data: result, // contains invoice + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getExpenseWithEmployeeId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Salesinvoice",
            });
        }
    }
    ,
    getExpensePrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Expense.aggregate([
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

                // 🧑‍💼 EMPLOYEE POPULATE
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
                {
                    $lookup: {
                        from: "expensedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "expenseId",
                        as: "expenseDetails",
                    },
                },
                {
                    $lookup: {
                        from: "expensetypes",
                        localField: "expenseDetails.expensetype",
                        foreignField: "_id",
                        as: "expenseTypeData",
                    },
                },
                {
                    $addFields: {
                        expenseDetails: {
                            $map: {
                                input: "$expenseDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            expensetype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$expenseTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.expensetype"],
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
                        expenseTypeData: 0, // cleanup
                    },
                },

                // 🔹 SUM expenseAmount
                {
                    $addFields: {
                        totalexpenseAmount: {
                            $sum: "$expenseDetails.expenseAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Expense not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains expense + expenseDetails[]
            });

        } catch (e) {
            console.error("Error in getExpensePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getExpensePrint",
            });
        }
    }
}