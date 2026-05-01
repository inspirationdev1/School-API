require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const Parent = require("../model/parent.model");
const cloudinary = require("../config/cloudinary");

module.exports = {

    getAllParents: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allParent = await Parent.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Section", data: allParent })
        } catch (error) {
            console.log("Error in getAllParent", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Parent. Try later" })
        }

    },
    getParentWithQuery: async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['name'] = { $regex: req.query.search, $options: 'i' }
            }



            const filteredParents = await Parent.find(filterQuery);
            res.status(200).json({ success: true, data: filteredParents })
        } catch (error) {
            console.log("Error in fetching Parent with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Parent  with query." })
        }

    },



    registerParent: async (req, res) => {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const existing = await Parent.find({ email: fields.email[0] });
                if (existing.length > 0) return res.status(500).json({ success: false, message: "Email Already Exist!" });

                let photoUrl = null;
                if (files.image && files.image[0]) {
                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "parents",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    photoUrl = result.secure_url;
                }

                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(fields.password[0], salt);

                const newParent = new Parent({
                    email: fields.email[0],
                    name: fields.name[0],
                    parent_code: fields.parent_code[0],
                    qualification: fields.qualification[0],
                    age: fields.age[0],
                    gender: fields.gender[0],
                    dOBDate: fields.dOBDate[0],
                    joinDate: fields.joinDate[0],
                    year: fields.year[0],
                    parent_image: photoUrl,
                    phoneno: fields.phoneno[0],
                    password: hashPassword,
                    school: req.user.id

                })

                const savedData = await newParent.save();
                res.status(200).json({ success: true, data: savedData, message: "Parent is Registered Successfully." });

            } catch (e) {
                console.log("Error in Register:", e);
                res.status(500).json({ success: false, message: "Failed Registration." + e.message });
            }
        });
    },
    loginParent: async (req, res) => {
        Parent.find({ email: req.body.email }).then(resp => {
            if (resp.length > 0) {
                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
                if (isAuth) {
                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId: resp[0].school,
                            name: resp[0].name,
                            image_url: resp[0].parent_image,
                            role: 'PARENT'
                        }, jwtSecret);

                    res.header("Authorization", token);
                    console.log("Success")
                    res.status(200).json({ success: true, message: "Success Login", user: { id: resp[0]._id, name: resp[0].name, image_url: resp[0].parent_image, role: 'PARENT' } })
                } else {
                    res.status(401).json({ success: false, message: "Password doesn't match." })
                }

            } else {
                res.status(401).json({ success: false, message: "Email not registerd." })
            }
        })
    },
    getParentOwnDetails: async (req, res) => {
        const id = req.user.id;
        Parent.findOne({ _id: id, school: req.user.schoolId }).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Parent data not Available" })
            }
        }).catch(e => {
            console.log("Error in getParentWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Parent Data" })
        })
    },
    getParentWithId: async (req, res) => {
        const id = req.params.id;
        Parent.findById(id).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Parent data not Available" })
            }
        }).catch(e => {
            console.log("Error in getParentWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Parent Data" })
        })
    },
    updateParentWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const { id } = req.params;

                const parent = await Parent.findById(id);
                if (!parent) return res.status(404).json({ success: false, message: "Parent not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    parent[field] = fields[field][0];
                });

                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (parent.parent_image && parent.public_id) {
                        await cloudinary.uploader.destroy(parent.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "parents",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    parent.parent_image = result.secure_url;
                    parent.public_id = result.public_id;
                }

                await parent.save();
                res.status(200).json({ success: true, message: "Parent updated successfully", data: parent });
            } catch (e) {
                console.log("Error updating parent:", e);
                res.status(500).json({ success: false, message: "Error updating parent details." });
            }
        });
    },
    deleteParentWithId: async (req, res) => {
        try {
            let id = req.params.id;
            // console.log(req.body)
            await Parent.findOneAndDelete({ _id: id });
            const ParentAfterDelete = await Parent.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Parent  deleted", data: ParentAfterDelete })
        } catch (error) {
            console.log("Error in updateParentWithId", error);
            res.status(500).json({ success: false, message: "Server Error in deleted Parent. Try later" })
        }

    },
    signOut: async (req, res) => {


        try {
            res.header("Authorization", "");
            "Authorization"
            res.status(200).json({ success: true, messsage: "Parent Signed Out  Successfully." })
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({ success: false, message: "Server Error in Signing Out. Try later" })
        }
    },
    isParentLoggedIn: async (req, res) => {
        try {
            let token = req.header("Authorization");
            if (token) {
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if (decoded) {
                    res.status(200).json({ success: true, data: decoded, message: "Parent is a logged in One" })
                } else {
                    res.status(401).json({ success: false, message: "You are not Authorized." })
                }
            } else {
                res.status(401).json({ success: false, message: "You are not Authorized." })
            }
        } catch (error) {
            console.log("Error in isParentLoggedIn", error);
            res.status(500).json({ success: false, message: "Server Error in Parent Logged in check. Try later" })
        }
    }

}