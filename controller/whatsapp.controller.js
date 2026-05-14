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
   
},
    send_whatsapp: async (req, res) => {
        
        
    },

}

