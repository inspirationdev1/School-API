require("dotenv").config();
const twilio = require("twilio");

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
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN,
        );
        // List of recipient numbers
        const numbers = ["whatsapp:+919550345573", "whatsapp:+917674968840"];
        for (const to of numbers) {
            try {
                const message = await client.messages.create({
                     from: process.env.TWILIO_WHATSAPP_NUMBER,
                    to: to,
                    body: "Hello from Node.js and Twilio WhatsApp 🚀",
                });

                console.log(`Message sent to ${to}`);
                console.log(`SID: ${message.sid}`);

                res.status(200).json({
                success: true,
                data: [],
                message: "Whatsapp sent Successfully."
            });
            } catch (error) {
                console.error(`Failed for ${to}`);
                console.error(error.message);
                res.status(500).json({
                success: false,
                message: error.message
            });
            }
        }
    },

}

