require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const Employee = require("../model/employee.model");
const cloudinary = require("../config/cloudinary");

const { getNumberseqWithScreenId, updateNumberseqWithScreenId } = require("../controller/numberseq.controller");

module.exports = {

    getEmployeeWithQuery: async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['employee_name'] = { $regex: req.query.search, $options: 'i' }
            }



            const filteredEmployees = await Employee.find(filterQuery);
            res.status(200).json({ success: true, data: filteredEmployees })
        } catch (error) {
            console.log("Error in fetching Employee with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Employee  with query." })
        }

    },


    registerEmployee: async (req, res) => {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const schoolId = req.user.schoolId;
                const existing = await Employee.find({ email: fields.email[0] });
                if (existing.length > 0) return res.status(500).json({ success: false, message: "Email Already Exist!" });

                let photoUrl = null;
                if (files.image && files.image[0]) {
                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "employees",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    photoUrl = result.secure_url;
                }

                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(fields.password[0], salt);

                //*****Get Numberseq */
                const numberseqData = await getNumberseqWithScreenId({ screen_id: "employee", schoolId: req.user.schoolId });
                console.log("numberseqData.data", numberseqData);
                let seq = 1;
                let code = "";
                if (numberseqData) {
                    seq = numberseqData.seq || 1;
                    code = numberseqData.code || "";
                }
                //******** */

                const newEmployee = new Employee({
                    email: fields.email[0],
                    employee_name: fields.employee_name[0],
                    qualification: fields.qualification[0],
                    age: fields.age[0],
                    gender: fields.gender[0],
                    dOBDate: fields.dOBDate[0],
                    joinDate: fields.joinDate[0],
                    year: fields.year[0],
                    status: fields.status[0],
                    employee_image: photoUrl,
                    phoneno: fields.phoneno[0],
                    password: hashPassword,
                    employee_code: code || "",
                    seq: seq || 1,
                    school: schoolId

                })

                const savedData = await newEmployee.save();

                //*****Update numberseq */
                const numberseqAfterUpdate = await updateNumberseqWithScreenId({ screen_id: "employee", schoolId: req.user.schoolId });
                console.log("numberseqAfterUpdate", numberseqAfterUpdate);
                //************ */

                res.status(200).json({ success: true, data: savedData, message: "Employee is Registered Successfully." });

            } catch (e) {
                console.log("Error in Register:", e);
                res.status(500).json({ success: false, message: "Failed Registration." });
            }
        });
    },

    loginEmployee: async (req, res) => {
        Employee.find({ email: req.body.email }).then(resp => {
            if (resp.length > 0) {
                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
                if (isAuth) {
                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId: resp[0].school,
                            name: resp[0].name,
                            image_url: resp[0].employee_image,
                            role: 'Employee'
                        }, jwtSecret);

                    res.header("Authorization", token);
                    console.log("Success")
                    res.status(200).json({ success: true, message: "Success Login", user: { id: resp[0]._id, username: resp[0].username, image_url: resp[0].employee_image, role: 'Employee' } })
                } else {
                    res.status(401).json({ success: false, message: "Password doesn't match." })
                }

            } else {
                res.status(401).json({ success: false, message: "Email not registerd." })
            }
        })
    },
    getEmployeeOwnDetails: async (req, res) => {
        const id = req.user.id;
        Employee.findOne({ _id: id, school: req.user.schoolId }).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Employee data not Available" })
            }
        }).catch(e => {
            console.log("Error in getEmployeeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Employee Data" })
        })
    },
    getEmployeeWithId: async (req, res) => {
        const id = req.params.id;
        Employee.findById(id).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Employee data not Available" })
            }
        }).catch(e => {
            console.log("Error in getEmployeeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Employee Data" })
        })
    },

    updateEmployeeWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const { id } = req.params;
                const employee = await Employee.findById(id);
                if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    employee[field] = fields[field][0];
                });

                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (employee.employee_image && employee.public_id) {
                        await cloudinary.uploader.destroy(employee.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "employees",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    employee.employee_image = result.secure_url;
                    employee.public_id = result.public_id;
                }

                await employee.save();
                res.status(200).json({ success: true, message: "Employee updated successfully", data: employee });
            } catch (e) {
                console.log("Error updating employee:", e);
                res.status(500).json({ success: false, message: "Error updating employee details." });
            }
        });
    },
    deleteEmployeeWithId: async (req, res) => {
        try {
            let id = req.params.id;
            // console.log(req.body)
            await Employee.findOneAndDelete({ _id: id });
            const EmployeeAfterDelete = await Employee.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Employee  deleted", data: EmployeeAfterDelete })
        } catch (error) {
            console.log("Error in updateEmployeeWithId", error);
            res.status(500).json({ success: false, message: "Server Error in deleted Employee. Try later" })
        }

    },
    signOut: async (req, res) => {


        try {
            res.header("Authorization", "");
            "Authorization"
            res.status(200).json({ success: true, messsage: "Employee Signed Out  Successfully." })
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({ success: false, message: "Server Error in Signing Out. Try later" })
        }
    },
    isEmployeeLoggedIn: async (req, res) => {
        try {
            let token = req.header("Authorization");
            if (token) {
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if (decoded) {
                    res.status(200).json({ success: true, data: decoded, message: "Employee is a logged in One" })
                } else {
                    res.status(401).json({ success: false, message: "You are not Authorized." })
                }
            } else {
                res.status(401).json({ success: false, message: "You are not Authorized." })
            }
        } catch (error) {
            console.log("Error in isEmployeeLoggedIn", error);
            res.status(500).json({ success: false, message: "Server Error in Employee Logged in check. Try later" })
        }
    }

}