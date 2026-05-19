require("dotenv").config();
const twilio = require("twilio");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const fs = require("fs");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");
const Teacher = require("../model/teacher.model");
const Parent = require("../model/parent.model");
const Student = require("../model/student.model");

const Class = require("../model/class.model");
const Section = require("../model/section.model");
const Generalmaster = require("../model/generalmaster.model");
const Employee = require("../model/employee.model");

module.exports = {


    send_whatsapp: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            const phone_no = "+91" + req.body?.phone_no
            const client = require('twilio')(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            const message = await client.messages.create({
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                contentSid: process.env.TWILIO_CONTENTSID,
                contentVariables: JSON.stringify({
                    1: "Message from SMS System",
                    2: "(Inspiration)"
                }),
                to: 'whatsapp:' + phone_no
            });



            console.log(message.sid);

            res.status(200).json({
                success: true,
                data: [],
                message: "Whatsapp sent Successfully."
            });

        } catch (error) {
            console.log(error);

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    send_bulk_whatsapp: async (req, res) => {
        try {

            const schoolId = req.user.schoolId;
            const classId = req.body?.class;
            const screenId = req.body?.screenId;
            let numbers = [
                "whatsapp:+919550345573",
                "whatsapp:+917674968840"
            ];
            const filterQuery = {};
            filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);
            if (screenId == "teacher") {
                console.log(screenId);
                // numbers = await Teacher.find(filterQuery)
                //     .populate("school")
                //     .lean();
                numbers = [
                    "+919550345573",
                    "+917674968840"
                ];

            } else if (screenId == "student") {
                console.log(screenId);
                numbers = await Student.find(filterQuery)
                    .populate("school")
                    .lean();
            } else if (screenId == "parent") {
                console.log(screenId);
                numbers = await Parent.find(filterQuery)
                    .populate("school")
                    .lean();
            } else if (screenId == "class") {
                console.log(screenId);
                filterQuery.student_class = classId;
                numbers = await Student.find(filterQuery)
                    .populate("school")
                    .lean();
                console.log(numbers);
            }
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );



            const results = [];

            for (const num of numbers) {

                try {
                    let phone_no = num?.phoneno || num?.guardian_phone || num
                    phone_no = 'whatsapp:' + phone_no;
                    const message =
                        await client.messages.create({
                            from:
                                process.env
                                    .TWILIO_WHATSAPP_NUMBER,
                            to: phone_no,
                            body:
                                "Hello from Node.js and Twilio WhatsApp 🚀",
                        });

                    console.log(
                        `Message sent to ${phone_no}`
                    );

                    console.log("SID:", message.sid);
                    console.log("STATUS:", message.status);
                    console.log("FROM:", message.from);
                    console.log("TO:", message.to);

                    results.push({
                        to,
                        sid: message.sid,
                        status: message.status,
                    });

                    // results.push({
                    //     phone_no,
                    //     success: true,
                    //     sid: message.sid,
                    // });

                } catch (error) {

                    console.error(
                        `Failed for ${phone_no}`
                    );

                    results.push({
                        phone_no,
                        success: false,
                        error: error.message,
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message:
                    "Bulk WhatsApp process completed.",
                data: results,
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }
    },
    send_bulk_whatsapp_sample: async (req, res) => {
        try {

            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            const numbers = [
                "whatsapp:+919550345573",
                "whatsapp:+917674968840"
            ];

            const results = [];

            for (const to of numbers) {

                try {

                    const message =
                        await client.messages.create({
                            from:
                                process.env
                                    .TWILIO_WHATSAPP_NUMBER,
                            to,
                            body:
                                "Hello from Node.js and Twilio WhatsApp 🚀",
                        });

                    console.log(
                        `Message sent to ${to}`
                    );

                    console.log("SID:", message.sid);
                    console.log("STATUS:", message.status);
                    console.log("FROM:", message.from);
                    console.log("TO:", message.to);

                    results.push({
                        to,
                        sid: message.sid,
                        status: message.status,
                    });

                    // results.push({
                    //     to,
                    //     success: true,
                    //     sid: message.sid,
                    // });

                } catch (error) {

                    console.error(
                        `Failed for ${to}`
                    );

                    results.push({
                        to,
                        success: false,
                        error: error.message,
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message:
                    "Bulk WhatsApp process completed.",
                data: results,
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
            });

        }
    },

}

