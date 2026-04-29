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

                const checkData = await Accountlevel.find({ school: schoolId, accountlevel_code: item?.accountlevel_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist accountlevel code :" + item?.accountlevel_code });
                    // break;
                }



                const groupData = await Accountlevel.find({ school: schoolId, accountlevel_code: item?.group_code });
                console.log("groupData", groupData);

                if (groupData.length > 0) {
                    item.groupId = groupData[0]?._id || null;
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
                item.school = schoolId;

                const checkData = await Accountledger.find({ school: schoolId, accountledger_code: item?.accountledger_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist accountledger code :" + item?.accountledger_code });
                    // break;
                }



                const groupData = await Accountlevel.find({ school: schoolId, accountlevel_code: item?.group_code });
                console.log("groupData", groupData);

                if (groupData.length == 0) {
                    return res.status(500).json({ success: false, message: "Group code does not exist :" + item?.group_code });
                } else {
                    item.groupId = groupData[0]?._id;
                }
            }

            // 👉 save to  here
            await Accountledger.insertMany(sheetData);
            console.log("Date saved", sheetData);
            fs.unlinkSync(filePath);
            res.status(200).json({ success: true, data: sheetData, message: "Accountledger is Uploaded Successfully." })
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
                    item.parent_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg";
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
                item.school = schoolId;
                const checkData = await Student.find({ school: schoolId, student_code: item?.student_code });
                console.log("checkData", checkData);
                if (checkData.length > 0) {
                    return res.status(500).json({ success: false, message: "Already exist Student Code :" + item?.student_code });
                    // break;
                }


                const student_name = item?.name.trim();
                const str = student_name;
                const cleaned = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                console.log(cleaned);
                const email = cleaned + "@mms.com";
                item.email = email;
                // const classData = await Class.find({ school: schoolId, class_code: item?.class_code });
                // console.log("classData", classData);
                // if (classData.length == 0) {
                //     return res.status(500).json({ success: false, message: "Class Code does not exist :" + item?.class_code });
                // }
                const classId = await CreateClass(item);
                item.student_class = classId;


                // const sectionData = await Section.find({ school: schoolId, section_code: item?.section_code });
                // console.log("sectionData", sectionData);
                // if (sectionData.length == 0) {
                //     return res.status(500).json({ success: false, message: "Section Code does not exist :" + item?.section_code });

                // }
                // item.section = sectionData[0]?._id;
                const sectionId = await CreateSection(item);
                item.section = sectionId;

                // const parentData = await Parent.find({ school: schoolId, parent_code: item?.parent_code });
                // console.log("parentData", parentData);
                // if (parentData.length == 0) {
                //     return res.status(500).json({ success: false, message: "Parent Code does not exist :" + item?.parent_code });
                // }


                const parentId = await CreateParent(item);
                item.parent = parentId;



                const password = "12345678";
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(password, salt);
                item.password = hashPassword;

                let gender = item?.gender.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();;

                if (gender === "b") {
                    gender = "male";
                    item.gender = gender;
                    item.student_image = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg";
                }else{
                    gender="female";
                    item.gender = gender;
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
                const phoneno = item?.guardian_phone||"1234567890";
                item.guardian_phone=phoneno
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

async function CreateParent(studentData) {
    let parentId = "";
    try {

        const parent_name = studentData?.parent_name||studentData?.name;

        const existing = await Parent.find({ name: parent_name, school: studentData.school }).lean();
        if (existing.length > 0) {
            parentId = existing[0]?._id;
            return parentId;
        }


        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync("12345678", salt);
        const str = parent_name;
        const cleaned = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        console.log(cleaned);
        const email = cleaned + "@mms.com";
        const gender = "male";
        const dOBDate = new Date("01/01/1990");
        const joinDate = new Date("01/01/2000");
        const year = joinDate.getFullYear();
        const photoUrl = "https://res.cloudinary.com/da3dxqer8/image/upload/v1776155794/teachers/1776155793311_parent1.jfif.jpg";
        const phoneno = studentData?.guardian_phone || "1234567890";
        const newParent = new Parent({
            email: email,
            name: parent_name,
            parent_code: parent_name,
            qualification: "",
            age: "",
            gender: gender,
            dOBDate: dOBDate,
            joinDate: joinDate,
            year: year,
            parent_image: photoUrl,
            password: hashPassword,
            school: studentData.school,
            phoneno: phoneno
        })

        const savedData = await newParent.save();
        parentId = savedData?._id;
        console.log("parentId", parentId);
        return parentId;

    } catch (e) {
        console.log("Error in Parent Register:", e);
        return parentId;
    }
}

async function CreateSection(studentData) {
    let sectionId = "";
    try {

        const section_name = studentData.section_name
        const existing = await Section.find({ section_name: section_name, school: studentData.school }).lean();
        if (existing.length > 0) {
            sectionId = existing[0]?._id;
            return sectionId;
        }



        const newSection = new Section({
            section_code: section_name,
            section_name: section_name,
            school: studentData.school,
        })

        const savedData = await newSection.save();
        sectionId = savedData?._id;
        console.log("sectionId", sectionId);
        return sectionId;

    } catch (e) {
        console.log("Error in Section Register:", e);
        return sectionId;
    }
}

async function CreateClass(studentData) {
    let classId = "";
    try {

        const class_name = studentData.class_name
        const existing = await Class.find({ class_name: class_name, school: studentData.school }).lean();
        if (existing.length > 0) {
            classId = existing[0]?._id;
            return classId;
        }

        const newClass = new Class({
            class_code: class_name,
            class_name: class_name,
            school: studentData.school,
        })

        const savedData = await newClass.save();
        classId = savedData?._id;
        console.log("classId", classId);
        return classId;

    } catch (e) {
        console.log("Error in Class Register:", e);
        return classId;
    }
}