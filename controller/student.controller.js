require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const Student = require("../model/student.model");
const Attendance = require('../model/attendance.model');

const cloudinary = require("../config/cloudinary");


const { getNumberseqWithScreenId, updateNumberseqWithScreenId } = require("../controller/numberseq.controller");


module.exports = {


    getStudentWithQuery: async (req, res) => {

        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['name'] = { $regex: req.query.search, $options: 'i' }
            }

            if (req.query.hasOwnProperty('student_class')) {
                filterQuery['student_class'] = req.query.student_class
            }

            if (req.query.hasOwnProperty('section')) {
                filterQuery['section'] = req.query.section
            }

            if (req.query.hasOwnProperty('parent')) {
                filterQuery['parent'] = req.query.parent
            }

            if (req.user?.role === 'STUDENT') {
                filterQuery['_id'] = req.user.id;
            }

            const filteredStudents = await Student.find(filterQuery).populate("student_class").populate("section").populate("parent")
                .populate("bloodgroup").populate("nationality")
                .populate("religion").populate("mothertongue").populate("modeoftransport").populate("firstlanguage");
            res.status(200).json({ success: true, data: filteredStudents })
        } catch (error) {
            console.log("Error in fetching Student with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Student  with query." })
        }

    },


    registerStudent: async (req, res) => {


        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const existing = await Student.find({ email: fields.email[0] });
                if (existing.length > 0) return res.status(500).json({ success: false, message: "Email Already Exist!" });

                let photoUrl = null;
                if (files.image && files.image[0]) {
                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "students",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    photoUrl = result.secure_url;
                }

                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(fields.password[0], salt);

                const numberseqData = await getNumberseqWithScreenId({ screen_name: "Student", schoolId: req.user.schoolId });
                console.log("numberseqData.data", numberseqData);
                let seq = 1;
                let code = "";
                if (numberseqData) {
                    seq = numberseqData.seq || 1;
                    code = numberseqData.code || "";
                }

                const newStudent = new Student({
                    email: fields.email[0],
                    name: fields.name[0],
                    student_class: fields.student_class[0],
                    guardian: fields.guardian[0],
                    guardian_phone: fields.guardian_phone[0],
                    pen_no: fields.pen_no[0],
                    aadhar_no: fields.aadhar_no[0],
                    admission_no: fields.admission_no[0],
                    age: fields.age[0],
                    dOBDate: fields.dOBDate[0],
                    joinDate: fields.joinDate[0],
                    year: fields.year[0],
                    vaccinated: fields.vaccinated[0],
                    gender: fields.gender[0],
                    parent: fields.parent[0],
                    section: fields.section[0],
                    bloodgroup: fields.bloodgroup[0],
                    nationality: fields.nationality[0],

                    religion: fields.religion[0],
                    mothertongue: fields.mothertongue[0],
                    modeoftransport: fields.modeoftransport[0],
                    firstlanguage: fields.firstlanguage[0],
                    identificationmark1: fields.identificationmark1[0],
                    identificationmark2: fields.identificationmark2[0],
                    permanentaddress: fields.permanentaddress[0],
                    permanentpincode: fields.permanentpincode[0],
                    presentaddress: fields.presentaddress[0],
                    presentpincode: fields.presentpincode[0],
                    nameofpreviousschool: fields.nameofpreviousschool[0],
                    classpassed: fields.classpassed[0],
                    yearofpassing: fields.yearofpassing[0],
                    reasonforleaving: fields.reasonforleaving[0],
                    studentexpelledleaving: fields.studentexpelledleaving[0],
                    mediumofinstructions: fields.mediumofinstructions[0],

                    siblingstudingname: fields.siblingstudingname[0],
                    siblingapplyingname: fields.siblingapplyingname[0],
                    siblingstudingclass: fields.siblingstudingclass[0],
                    siblingapplyingclass: fields.siblingapplyingclass[0],
                    previouslyapplied: fields.previouslyapplied[0],
                    admissionintoclass: fields.admissionintoclass[0],
                    dateofaddmission: fields.dateofaddmission[0],



                    student_image: photoUrl,
                    password: hashPassword,
                    student_code: code || "",
                    seq: seq || 1,
                    school: req.user.id,
                });

                const savedData = await newStudent.save();

                const numberseqAfterUpdate = await updateNumberseqWithScreenId({ screen_name: "Student", schoolId: req.user.schoolId });
                console.log("numberseqAfterUpdate", numberseqAfterUpdate);

                res.status(200).json({ success: true, data: savedData, message: "Student is Registered Successfully." });

            } catch (e) {
                console.log("Error in Register:", e);
                res.status(500).json({ success: false, message: "Failed Registration." });
            }
        });
    },
    loginStudent: async (req, res) => {
        Student.find({ email: req.body.email }).then(resp => {
            if (resp.length > 0) {
                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
                if (isAuth) {
                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId: resp[0].school,
                            email: resp[0].email,
                            image_url: resp[0].image_url,
                            name: resp[0].name,
                            role: 'STUDENT'
                        }, jwtSecret);

                    res.header("Authorization", token);

                    res.status(200).json({
                        success: true, message: "Success Login", user: {
                            id: resp[0]._id,
                            email: resp[0].email,
                            image_url: resp[0].student_image,
                            name: resp[0].name,
                            role: 'STUDENT'
                        }
                    })
                } else {
                    res.status(401).json({ success: false, message: "Password doesn't match." })
                }

            } else {
                res.status(401).json({ success: false, message: "Email not registerd." })
            }
        })
    },
    getStudentWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Student.findOne({ _id: id, school: schoolId }).populate("student_class").populate("section").populate("parent")
            .populate("bloodgroup").populate("nationality")
            .populate("religion").populate("mothertongue").populate("modeoftransport").populate("firstlanguage")
            .then(resp => {
                if (resp) {
                    console.log("data", resp)
                    res.status(200).json({ success: true, data: resp })
                } else {
                    res.status(500).json({ success: false, message: "Student data not Available" })
                }
            }).catch(e => {
                console.log("Error in getStudentWithId", e)
                res.status(500).json({ success: false, message: "Error in getting  Student Data" })
            })
    },
    getOwnDetails: async (req, res) => {
        const id = req.user.id;
        const schoolId = req.user.schoolId;
        Student.findOne({ _id: id, school: schoolId }).populate("student_class").populate("section").populate("parent")
            .populate("bloodgroup").populate("nationality")
            .populate("religion").populate("mothertongue").populate("modeoftransport").populate("firstlanguage")
            .then(resp => {
                if (resp) {
                    console.log("data", resp)
                    res.status(200).json({ success: true, data: resp })
                } else {
                    res.status(500).json({ success: false, message: "Student data not Available" })
                }
            }).catch(e => {
                console.log("Error in getStudentWithId", e)
                res.status(500).json({ success: false, message: "Error in getting  Student Data" })
            })
    },


    updateStudentWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });


            try {
                const { id } = req.params;
                const student = await Student.findById(id);
                if (!student) return res.status(404).json({ success: false, message: "Student not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    student[field] = fields[field][0];
                });

                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (student.student_image && student.public_id) {
                        await cloudinary.uploader.destroy(student.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "students",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    student.student_image = result.secure_url;
                    student.public_id = result.public_id;
                }

                await student.save();


                res.status(200).json({ success: true, message: "Student updated successfully", data: student });
            } catch (e) {
                console.log("Error updating student:", e);
                res.status(500).json({ success: false, message: "Error updating student details." });
            }
        });
    },
    deleteStudentWithId: async (req, res) => {
        try {
            let id = req.params.id;
            const schoolId = req.user.schoolId;
            await Attendance.deleteMany({ school: schoolId, student: id })
            await Student.findOneAndDelete({ _id: id, school: schoolId, });
            const studentAfterDelete = await Student.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Student  deleted", data: studentAfterDelete })
        } catch (error) {
            console.log("Error in updateStudentWithId", error);
            res.status(500).json({ success: false, message: "Server Error in deleted Student. Try later" })
        }

    },
    signOut: async (req, res) => {


        try {
            res.header("Authorization", "");
            "Authorization"
            res.status(200).json({ success: true, messsage: "Student Signed Out  Successfully." })
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({ success: false, message: "Server Error in Signing Out. Try later" })
        }
    },
    isStudentLoggedIn: async (req, res) => {
        try {
            let token = req.header("Authorization");
            if (token) {
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if (decoded) {
                    res.status(200).json({ success: true, data: decoded, message: "Student is a logged in One" })
                } else {
                    res.status(401).json({ success: false, message: "You are not Authorized." })
                }
            } else {
                res.status(401).json({ success: false, message: "You are not Authorized." })
            }
        } catch (error) {
            console.log("Error in isStudentLoggedIn", error);
            res.status(500).json({ success: false, message: "Server Error in Student Logged in check. Try later" })
        }
    }

}