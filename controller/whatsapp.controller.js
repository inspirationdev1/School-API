require("dotenv").config();

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

    send_whatsapp_Multiple: async (req, res) => {
    try {

        const schoolId = req.user.schoolId;

        // Example array from frontend
        // ["9550345573", "9876543210"]

        // const phoneNumbers = req.body.phone_numbers || [];
         const phoneNumbers = ["9550345573", "7674968840"];

        const client = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const results = [];

        for (const number of phoneNumbers) {

            const phone_no = "+91" + number;

            try {

                const message = await client.messages.create({
                    from: 'whatsapp:+14155238886',

                    contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',

                    contentVariables: JSON.stringify({
                        1: "Message from SMS System",
                        2: "(Inspiration)"
                    }),

                    to: 'whatsapp:' + phone_no
                });

                results.push({
                    phone: phone_no,
                    success: true,
                    sid: message.sid
                });

            } catch (err) {

                results.push({
                    phone: phone_no,
                    success: false,
                    error: err.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Whatsapp messages processed",
            data: results
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
},
    send_whatsapp: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            //  const phoneNumbers = ["9550345573", "7674968840"];

            const phone_no = "+91" + req.body?.phone_no
            const client = require('twilio')(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            
            const message = await client.messages.create({
                from: 'whatsapp:+14155238886',
                contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
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

}

