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

module.exports = {


    upload_accountlevel: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects




            for (const item of sheetData) {
                item.school = schoolId;

                const checkData = await Accountlevel.find({ school: schoolId, student_code: item?.student_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Student Code :" + item?.student_code });
                    // break;
                }



                const acclevelData = await Accountlevel.find({ school: schoolId, accountlevel_code: item?.group_code });
                console.log("acclevelData", acclevelData);
                
                if (acclevelData.length > 0) {
                    item.groupId = acclevelData[0]?._id || null;
                } else {
                    item.groupId = null;
                }
            }

            // 👉 save to  here
            await Accountlevel.insertMany(sheetData);
            console.log("Date saved", sheetData);
            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Accountlevel is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_accountledger: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects




            for (const item of sheetData) {
                const acclevelData = await Accountlevel.find({ school: schoolId, accountlevel_code: item?.link_code });
                console.log("acclevelData", acclevelData);
                item.school = schoolId;
                if (acclevelData.length > 0) {
                    item.groupId = acclevelData[0]?._id || null;
                }
            }

            // 👉 save to  here
            await Accountlevel.insertMany(sheetData);
            console.log("Date saved", sheetData);
            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Accountlevel is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_teacher: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects


            for (const item of sheetData) {
                const checkData = await Teacher.find({ school: schoolId, teacher_code: item?.teacher_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Teacher Code :" + item?.teacher_code });
                    // break;
                }
                item.school = schoolId;
                const password = "12345678";
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(password, salt);
                item.password = hashPassword;
                if (item.gender === 'male') {
                    item.teacher_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg"
                } else {
                    item.teacher_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155842/teachers/1776155841196_parent2.jfif.jpg";

                }
                let excelValue = item?.dOBDate;
                let jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let dOBDate = jsDate;
                item.dOBDate = dOBDate;

                excelValue = item?.joinDate;
                jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let joinDate = jsDate;
                item.joinDate = joinDate;
            }

            // 👉 save to  here
            await Teacher.insertMany(sheetData);
            console.log("Date saved", sheetData);

            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Teacher is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_parent: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects


            for (const item of sheetData) {
                const checkData = await Parent.find({ school: schoolId, parent_code: item?.parent_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Parent Code :" + item?.parent_code });
                    // break;
                }
                item.school = schoolId;
                const password = "12345678";
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(password, salt);
                item.password = hashPassword;
                if (item.gender === 'male') {
                    item.parent_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg"
                } else {
                    item.parent_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155842/teachers/1776155841196_parent2.jfif.jpg";
                }
                let excelValue = item?.dOBDate;
                let jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let dOBDate = jsDate;
                item.dOBDate = dOBDate;

                excelValue = item?.joinDate;
                jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let joinDate = jsDate;
                item.joinDate = joinDate;
            }

            // 👉 save to  here
            await Parent.insertMany(sheetData);
            console.log("Date saved", sheetData);

            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Parent is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_student: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects


            for (const item of sheetData) {
                const checkData = await Student.find({ school: schoolId, student_code: item?.student_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Student Code :" + item?.student_code });
                    // break;
                }
                const parentData = await Parent.find({ school: schoolId, parent_code: item?.parent_code });
                console.log("parentData", parentData);
                if (parentData.length == 0) {
                    return res.status(500).json({ success: false, message: "Parent Code does not exist :" + item?.parent_code });
                    // break;
                }
                item.parent = parentData[0]?._id;


                const classData = await Class.find({ school: schoolId, class_code: item?.class_code });
                console.log("classData", classData);
                if (classData.length == 0) {
                    return res.status(500).json({ success: false, message: "Class Code does not exist :" + item?.class_code });
                    // break;
                }
                item.student_class = classData[0]?._id;

                const sectionData = await Section.find({ school: schoolId, section_code: item?.section_code });
                console.log("sectionData", sectionData);
                if (sectionData.length == 0) {
                    return res.status(500).json({ success: false, message: "Section Code does not exist :" + item?.section_code });
                    // break;
                }
                item.section = sectionData[0]?._id;

                item.school = schoolId;
                const password = "12345678";
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(password, salt);
                item.password = hashPassword;
                if (item.gender === 'male') {
                    item.student_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg"
                } else {
                    item.student_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155842/teachers/1776155841196_parent2.jfif.jpg";
                }
                let excelValue = item?.dOBDate;
                let jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let dOBDate = jsDate;
                item.dOBDate = dOBDate;

                excelValue = item?.joinDate;
                jsDate = excelDateToJSDate(excelValue);
                console.log(jsDate);
                let joinDate = jsDate;
                item.joinDate = joinDate;
            }

            // 👉 save to  here
            await Student.insertMany(sheetData);
            console.log("Date saved", sheetData);

            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Student is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_class: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects


            for (const item of sheetData) {
                const checkData = await Class.find({ school: schoolId, class_code: item?.class_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Class Code :" + item?.class_code });
                    // break;
                }



                item.school = schoolId;

            }

            // 👉 save to  here
            await Class.insertMany(sheetData);
            console.log("Date saved", sheetData);

            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Class is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    upload_section: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const filePath = req.file.path;

            // read excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName]
            );

            console.log(sheetData); // array of objects


            for (const item of sheetData) {
                const checkData = await Section.find({ school: schoolId, section_code: item?.section_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Section Code :" + item?.section_code });
                    // break;
                }



                item.school = schoolId;

            }

            // 👉 save to  here
            await Section.insertMany(sheetData);
            console.log("Date saved", sheetData);

            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Section is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
}

function excelDateToJSDate(serial) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel base date
    const days = Number(serial);

    const result = new Date(excelEpoch.getTime() + days * 86400000);
    return result;
}