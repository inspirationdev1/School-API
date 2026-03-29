require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const School = require("../model/school.model");
const cloudinary = require("../config/cloudinary");

module.exports = {

    getAllSchools: async (req, res) => {
        try {
            const schools = await School.find().select(['-_id', '-password', '-email', '-owner_name', '-createdAt']);
            res.status(200).json({ success: true, message: "Success in fetching all  Schools", data: schools })
        } catch (error) {
            console.log("Error in getAllSchools", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Schools. Try later" })
        }

    },
    registerSchool: async (req, res) => {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const existing = await School.find({ email: fields.email[0] });
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

                // const newStudent = new Student({
                //     email: fields.email[0],
                //     name: fields.name[0],
                //     student_class: fields.student_class[0],
                //     guardian: fields.guardian[0],
                //     guardian_phone: fields.guardian_phone[0],
                //     age: fields.age[0],
                //     dOBDate: fields.dOBDate[0],
                //     joinDate: fields.joinDate[0],
                //     year: fields.year[0],
                //     gender: fields.gender[0],
                //     parent: fields.parent[0],
                //     section: fields.section[0],
                //     student_image: photoUrl,
                //     password: hashPassword,
                //     school: req.user.id,
                // });
                const newSchool = new School({
                    school_name: fields.school_name[0],
                    email: fields.email[0],
                    owner_name: fields.owner_name[0],
                    address: fields.address[0],
                    city: fields.city[0],
                    state: fields.state[0],
                    zipcode: fields.zipcode[0],
                    country: fields.country[0],
                    password: hashPassword,
                    school_image: photoUrl
                })

                const savedData = await newSchool.save();
                res.status(200).json({ success: true, data: savedData, message: "School is Registered Successfully." });

            } catch (e) {
                console.log("Error in Register:", e);
                res.status(500).json({ success: false, message: "Failed Registration." });
            }
        });
    },
    loginSchool: async (req, res) => {
        try {

            const resp = await School.find({ email: req.body.email });

            if (resp.length > 0) {

                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);

                if (isAuth) {

                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId: resp[0]._id,
                            school_name: resp[0].school_name,
                            owner_name: resp[0].owner_name,
                            image_url: resp[0].school_image,
                            role: "SCHOOL"
                        },
                        jwtSecret
                    );

                    res.header("Authorization", token);

                    return res.status(200).json({
                        success: true,
                        message: "Success Login",
                        user: {
                            id: resp[0]._id,
                            owner_name: resp[0].owner_name,
                            school_name: resp[0].school_name,
                            image_url: resp[0].school_image,
                            role: "SCHOOL"
                        }
                    });

                } else {
                    return res.status(401).json({
                        success: false,
                        message: "Password doesn't match."
                    });
                }

            } else {
                return res.status(401).json({
                    success: false,
                    message: "Email not registered."
                });
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    getSchoolOwnData: async (req, res) => {
        const id = req.user.id;
        School.findById(id).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "School data not Available" })
            }
        }).catch(e => {
            console.log("Error in getSchoolWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  School Data" })
        })
    },

    updateSchoolWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            console.log(fields)
            if (err) {
                return res.status(400).json({ message: "Error parsing the form data." });
            }
            try {
                const id = req.user.id;
                const school = await School.findById(id);

                if (!school) {
                    return res.status(404).json({ message: "School not found." });
                }


                // Update text fields
                Object.keys(fields).forEach((field) => {
                    school[field] = fields[field][0];
                });



                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (school.school_image && school.public_id) {
                        await cloudinary.uploader.destroy(school.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "school",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    school.school_image = result.secure_url;
                    school.public_id = result.public_id;
                }
                // Save the updated school document
                await school.save();
                res.status(200).json({ message: "School updated successfully", data: school });
            } catch (e) {
                console.log(e);
                res.status(500).json({ message: "Error updating school details." });
            }
        });
    },
    signOut: async (req, res) => {


        try {
            res.header("Authorization", "");
            // "Authorization"
            res.status(200).json({ success: true, messsage: "School Signed Out  Successfully." })
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({ success: false, message: "Server Error in Signing Out. Try later" })
        }
    },
    isSchoolLoggedIn: async (req, res) => {
        try {
            let token = req.header("Authorization");
            if (token) {
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if (decoded) {
                    res.status(200).json({ success: true, data: decoded, message: "School is a logged in One" })
                } else {
                    res.status(401).json({ success: false, message: "You are not Authorized." })
                }
            } else {
                res.status(401).json({ success: false, message: "You are not Authorized." })
            }
        } catch (error) {
            console.log("Error in isSchoolLoggedIn", error);
            res.status(500).json({ success: false, message: "Server Error in School Logged in check. Try later" })
        }
    }
}