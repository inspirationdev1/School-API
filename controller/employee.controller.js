require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;

const Employee = require("../model/employee.model");
module.exports = {

    getEmployeeWithQuery: async(req, res)=>{
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if(req.query.hasOwnProperty('search')){
                filterQuery['name'] = {$regex: req.query.search, $options:'i'}
            }
            
          
    
            const filteredEmployees = await Employee.find(filterQuery);
            res.status(200).json({success:true, data:filteredEmployees})
        } catch (error) {
            console.log("Error in fetching Employee with query", error);
            res.status(500).json({success:false, message:"Error  in fetching Employee  with query."})
        }

    },


    registerEmployee: async (req, res) => {
        const form = new formidable.IncomingForm();
        const schoolId = req.user.schoolId;
        form.parse(req, (err, fields, files) => {
            Employee.find({ email: fields.email[0] }).then(resp => {
                if (resp.length > 0) {
                    res.status(500).json({ success: false, message: "Email Already Exist!" })
                } else {

                    const photo = files.image[0];
                    let oldPath = photo.filepath;
                    let originalFileName = photo.originalFilename.replace(" ", "_")

                    let newPath = path.join(__dirname, '../../frontend/public/images/uploaded/employee', '/', originalFileName)

                    let photoData = fs.readFileSync(oldPath);
                    fs.writeFile(newPath, photoData, function (err) {
                        if (err) console.log(err);

                        var salt = bcrypt.genSaltSync(10);
                        var hashPassword = bcrypt.hashSync(fields.password[0], salt);

                        const newEmployee = new Employee({
                            email: fields.email[0],
                            employee_name: fields.employee_name[0],
                            employee_code: fields.employee_code[0],
                            qualification:fields.qualification[0],
                            age: fields.age[0],
                            gender: fields.gender[0],

                            employee_image: originalFileName,
                            password: hashPassword,
                            school:schoolId
                         
                        })

                        newEmployee.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Employee is Registered Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Registration." })
                        })

                    })


                }
            })

        })



    },
    loginEmployee: async (req, res) => {
        Employee.find({ email: req.body.email }).then(resp => {
            if (resp.length > 0) {
                const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
                if (isAuth) {   
                    const token = jwt.sign(
                        {
                            id: resp[0]._id,
                            schoolId:resp[0].school,
                            name: resp[0].name,
                            image_url: resp[0].employee_image,
                            role: 'Employee'
                        }, jwtSecret );

                       res.header("Authorization", token);
                       console.log("Success")
                   res.status(200).json({ success: true, message: "Success Login",  user: { id: resp[0]._id, username: resp[0].username, image_url: resp[0].employee_image, role: 'Employee' } })
                }else {
                    res.status(401).json({ success: false, message: "Password doesn't match." })
                }

            } else {
                res.status(401).json({ success: false, message: "Email not registerd." })
            }
        })
    },
    getEmployeeOwnDetails: async(req, res)=>{
        const id = req.user.id;
        Employee.findOne({_id:id, school:req.user.schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Employee data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getEmployeeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Employee Data" })
        })
    },
    getEmployeeWithId: async(req, res)=>{
        const id = req.params.id;
        Employee.findById(id).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Employee data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getEmployeeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Employee Data" })
        })
    },

    // updateEmployeeWithId: async(req, res)=>{
       
    //     try {
    //         let id = req.params.id;
    //         console.log(req.body)
    //         await Employee.findOneAndUpdate({_id:id},{$set:{...req.body}});
    //         const EmployeeAfterUpdate =await Employee.findOne({_id:id});
    //         res.status(200).json({success:true, message:"Employee Updated", data:EmployeeAfterUpdate})
    //     } catch (error) {
            
    //         console.log("Error in updateEmployeeWithId", error);
    //         res.status(500).json({success:false, message:"Server Error in Update Employee. Try later"})
    //     }

    // },
    updateEmployeeWithId: async (req, res) => {
        const form =new formidable.IncomingForm({ multiples: false, uploadDir: path.join(__dirname, '../../frontend/public/images/uploaded/employee'), keepExtensions: true });
      
        form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.status(400).json({ message: "Error parsing the form data." });
          }
          try {
            const { id } = req.params;
            const employee = await Employee.findById(id);
      
            if (!employee) {
              return res.status(404).json({ message: "employee not found." });
            }
      
            // Update text fields
            Object.keys(fields).forEach((field) => {
              employee[field] = fields[field][0];
            });
      
            // Handle image file if provided
            if (files.image) {
              // Delete the old image if it exists
              const oldImagePath = path.join(__dirname, '../../frontend/public/images/uploaded/employee',  employee.employee_image);
               
              if (employee.employee_image && fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (unlinkErr) => {
                  if (unlinkErr) console.log("Error deleting old image:", unlinkErr);
                });
              }
      
              // Set the new image filename
            
              let filepath = files.image[0].filepath;
              const originalFileName = path.basename(files.image[0].originalFilename.replace(" ", "_"));
              let newPath = path.join(__dirname, '../../frontend/public/images/uploaded/employee', '/', originalFileName)
    
              let photoData = fs.readFileSync(filepath);
              
             fs.writeFileSync(newPath, photoData);
              employee.employee_image=originalFileName;
            }
      
            // Save the updated employee document
            await employee.save();
            res.status(200).json({ message: "employee updated successfully", data: employee });
          } catch (e) {
            console.log(e);
            res.status(500).json({ message: "Error updating employee details." });
          }
        })
    },
    deleteEmployeeWithId: async(req, res)=>{
        try {
            let id = req.params.id;
            // console.log(req.body)
            await Employee.findOneAndDelete({_id:id});
            const EmployeeAfterDelete =await Employee.findOne({_id:id});
            res.status(200).json({success:true, message:"Employee  deleted", data:EmployeeAfterDelete})
        } catch (error) {
            console.log("Error in updateEmployeeWithId", error);
            res.status(500).json({success:false, message:"Server Error in deleted Employee. Try later"})
        }

    },
    signOut:async(req, res)=>{
       

        try {
            res.header("Authorization",  "");
            "Authorization"
            res.status(200).json({success:true, messsage:"Employee Signed Out  Successfully."})
        } catch (error) {
            console.log("Error in Sign out", error);
            res.status(500).json({success:false, message:"Server Error in Signing Out. Try later"})
        }
    },
    isEmployeeLoggedIn: async(req,  res)=>{
        try {
            let token = req.header("Authorization");
            if(token){
                var decoded = jwt.verify(token, jwtSecret);
                console.log(decoded)
                if(decoded){
                    res.status(200).json({success:true,  data:decoded, message:"Employee is a logged in One"})
                }else{
                    res.status(401).json({success:false, message:"You are not Authorized."})
                }
            }else{
                res.status(401).json({success:false, message:"You are not Authorized."})
            }
        } catch (error) {
            console.log("Error in isEmployeeLoggedIn", error);
            res.status(500).json({success:false, message:"Server Error in Employee Logged in check. Try later"})
        }
    }
   
}