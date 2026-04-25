

require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const User = require("../model/user.model");
const cloudinary = require("../config/cloudinary");
module.exports = {

    getAllUsers: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allUser = await User.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Section", data: allUser })
        } catch (error) {
            console.log("Error in getAllUser", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All User. Try later" })
        }

    },
    getUserWithQuery: async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['name'] = { $regex: req.query.search, $options: 'i' }
            }



            const filteredUsers = await User.find(filterQuery);
            res.status(200).json({ success: true, data: filteredUsers })
        } catch (error) {
            console.log("Error in fetching User with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching User  with query." })
        }

    },


    registerUser: async (req, res) => {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const schoolId = req.user.schoolId;
                const existing = await User.find({ email: fields.email[0] });
                if (existing.length > 0) return res.status(500).json({ success: false, message: "Email Already Exist!" });

                let photoUrl = null;
                if (files.image && files.image[0]) {
                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "users",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    photoUrl = result.secure_url;
                }

                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(fields.password[0], salt);


                const newUser = new User({
                    email: fields.email[0],
                    name: fields.name[0],
                    user_code: fields.user_code[0],
                    qualification: fields.qualification[0],
                    age: fields.age[0],
                    gender: fields.gender[0],
                    dOBDate: fields.dOBDate[0],
                    joinDate: fields.joinDate[0],
                    year: fields.year[0],
                    user_image: photoUrl,
                    password: hashPassword,
                    school: schoolId

                })

                const savedData = await newUser.save();
                res.status(200).json({ success: true, data: savedData, message: "User is Registered Successfully." });

            } catch (e) {
                console.log("Error in Register:", e);
                res.status(500).json({ success: false, message: "Failed Registration." });
            }
        });
    },
    loginUser: async (req, res) => {
        User.find({ email: req.body.email }).then(resp => {
            if (resp.length > 0) {
                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
                if (isAuth) {
                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId: resp[0].school,
                            name: resp[0].name,
                            image_url: resp[0].user_image,
                            role: 'USER'
                        }, jwtSecret);

                    res.header("Authorization", token);
                    console.log("Success")
                    res.status(200).json({ success: true, message: "Success Login", user: { id: resp[0]._id, name: resp[0].name, image_url: resp[0].user_image, role: 'USER' } })
                } else {
                    res.status(401).json({ success: false, message: "Password doesn't match." })
                }

            } else {
                res.status(401).json({ success: false, message: "Email not registerd." })
            }
        })
    },
    getUserOwnDetails: async (req, res) => {
        const id = req.user.id;
        User.findOne({ _id: id, school: req.user.schoolId }).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "User data not Available" })
            }
        }).catch(e => {
            console.log("Error in getUserWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  User Data" })
        })
    },
    getUserWithId: async (req, res) => {
        const id = req.params.id;
        User.findById(id).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "User data not Available" })
            }
        }).catch(e => {
            console.log("Error in getUserWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  User Data" })
        })
    },


    updateUserWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const { id } = req.params;

                const user = await User.findById(id);
                if (!user) return res.status(404).json({ success: false, message: "User not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    user[field] = fields[field][0];
                });

                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (user.user_image && user.public_id) {
                        await cloudinary.uploader.destroy(user.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "users",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    user.user_image = result.secure_url;
                    user.public_id = result.public_id;
                }

                await user.save();
                res.status(200).json({ success: true, message: "User updated successfully", data: user });
            } catch (e) {
                console.log("Error updating user:", e);
                res.status(500).json({ success: false, message: "Error updating user details." });
            }
        });
    },
    deleteUserWithId: async (req, res) => {
        try {
            let id = req.params.id;
            // console.log(req.body)
            await User.findOneAndDelete({ _id: id });
            const UserAfterDelete = await User.findOne({ _id: id });
            res.status(200).json({ success: true, message: "User  deleted", data: UserAfterDelete })
        } catch (error) {
            console.log("Error in updateUserWithId", error);
            res.status(500).json({ success: false, message: "Server Error in deleted User. Try later" })
        }

    },
    signOut: async (req, res) => {


        try {
            res.header("Authorization", "");
            "Authorization"
            res.status(200).json({ success: true, messsage: "User Signed Out  Successfully." })
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({ success: false, message: "Server Error in Signing Out. Try later" })
        }
    },
    isUserLoggedIn: async (req, res) => {
        try {
            let token = req.header("Authorization");
            if (token) {
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if (decoded) {
                    res.status(200).json({ success: true, data: decoded, message: "User is a logged in One" })
                } else {
                    res.status(401).json({ success: false, message: "You are not Authorized." })
                }
            } else {
                res.status(401).json({ success: false, message: "You are not Authorized." })
            }
        } catch (error) {
            console.log("Error in isUserLoggedIn", error);
            res.status(500).json({ success: false, message: "Server Error in User Logged in check. Try later" })
        }
    }

}