require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWTSECRET;

const Teacher = require("../model/teacher.model");
const cloudinary = require("../config/cloudinary");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getTeacherWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      filterQuery["school"] = schoolId;
      if (req.query.hasOwnProperty("search")) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      if (req.user?.role === "TEACHER") {
        filterQuery["_id"] = req.user.id;
      }

      const filteredTeachers =
        await Teacher.find(filterQuery);
      res.status(200).json({ success: true, data: filteredTeachers });
    } catch (error) {
      console.log("Error in fetching Teacher with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Teacher  with query.",
      });
    }
  },

  registerTeacher: async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const schoolId = req.user.schoolId;
        const existing = await Teacher.find({ email: fields.email[0] });
        if (existing.length > 0)
          return res
            .status(500)
            .json({ success: false, message: "Email Already Exist!" });

        let photoUrl = null;
        if (files.image && files.image[0]) {
          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "teachers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          photoUrl = result.secure_url;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(fields.password[0], salt);
        //*****Get Numberseq */
        const numberseqData = await getNumberseqWithScreenId({
          screen_id: "teacher",
          schoolId: req.user.schoolId,
        });
        console.log("numberseqData.data", numberseqData);
        let seq = 1;
        let code = "";
        if (numberseqData) {
          seq = numberseqData.seq || 1;
          code = numberseqData.code || "";
        }
        //******** */
        const newTeacher = new Teacher({
          email: fields.email[0],
          name: fields.name[0],
          qualification: fields.qualification[0],
          age: fields.age[0],
          gender: fields.gender[0],
          dOBDate: fields.dOBDate[0],
          joinDate: fields.joinDate[0],
          year: fields.year[0],
          status: fields.status[0],
          phoneno: fields.phoneno[0],
          teacher_image: photoUrl,
          password: hashPassword,
          teacher_code: code || "",
          seq: seq || 1,
          school: schoolId,
        });

        const savedData = await newTeacher.save();

        //*****Update numberseq */
        const numberseqAfterUpdate = await updateNumberseqWithScreenId({
          screen_id: "teacher",
          schoolId: req.user.schoolId,
        });
        console.log("numberseqAfterUpdate", numberseqAfterUpdate);
        //************ */

        res.status(200).json({
          success: true,
          data: savedData,
          message: "Teacher is Registered Successfully.",
        });
      } catch (e) {
        console.log("Error in Register:", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Registration." });
      }
    });
  },
  loginTeacher: async (req, res) => {
    Teacher.find({ email: req.body.email }).then((resp) => {
      if (resp.length > 0) {
        const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
        if (isAuth) {
          const token = jwt.sign(
            {
              id: resp[0]._id,
              schoolId: resp[0].school,
              name: resp[0].name,
              image_url: resp[0].teacher_image,
              role: "TEACHER",
            },
            jwtSecret,
          );

          res.header("Authorization", token);
          console.log("Success");
          res.status(200).json({
            success: true,
            message: "Success Login",
            user: {
              id: resp[0]._id,
              name: resp[0].name,
              image_url: resp[0].teacher_image,
              role: "TEACHER",
            },
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "Password doesn't match." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "Email not registerd." });
      }
    });
  },
  getTeacherOwnDetails: async (req, res) => {
    const id = req.user.id;
    Teacher.findOne({ _id: id, school: req.user.schoolId })
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Teacher data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getTeacherWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Teacher Data" });
      });
  },
  getTeacherWithId: async (req, res) => {
    const id = req.params.id;
    Teacher.findById(id)
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Teacher data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getTeacherWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Teacher Data" });
      });
  },

  updateTeacherWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const { id } = req.params;
        const teacher = await Teacher.findById(id);
        if (!teacher)
          return res
            .status(404)
            .json({ success: false, message: "Teacher not found." });

        // Update text fields
        Object.keys(fields).forEach((field) => {
          teacher[field] = fields[field][0];
        });

        // Handle image upload to Cloudinary
        if (files.image && files.image[0]) {
          // Optional: Delete old image from Cloudinary if needed
          if (teacher.teacher_image && teacher.public_id) {
            await cloudinary.uploader.destroy(teacher.public_id);
          }

          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "teachers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          teacher.teacher_image = result.secure_url;
          teacher.public_id = result.public_id;
        }

        await teacher.save();
        res.status(200).json({
          success: true,
          message: "Teacher updated successfully",
          data: teacher,
        });
      } catch (e) {
        console.log("Error updating teacher:", e);
        res
          .status(500)
          .json({ success: false, message: "Error updating teacher details." });
      }
    });
  },
  deleteTeacherWithId: async (req, res) => {
    try {
      let id = req.params.id;
      // console.log(req.body)
      await Teacher.findOneAndDelete({ _id: id });
      const TeacherAfterDelete = await Teacher.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Teacher  deleted",
        data: TeacherAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateTeacherWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in deleted Teacher. Try later",
      });
    }
  },
  signOut: async (req, res) => {
    try {
      res.header("Authorization", "");
      ("Authorization");
      res
        .status(200)
        .json({ success: true, messsage: "Teacher Signed Out  Successfully." });
    } catch (error) {
      console.log("Error in Sign out", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Signing Out. Try later",
      });
    }
  },
  isTeacherLoggedIn: async (req, res) => {
    try {
      let token = req.header("Authorization");
      if (token) {
        var decoded = jwt.verify(token, jwtSecret);
        console.log(decoded);
        if (decoded) {
          res.status(200).json({
            success: true,
            data: decoded,
            message: "Teacher is a logged in One",
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "You are not Authorized." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "You are not Authorized." });
      }
    } catch (error) {
      console.log("Error in isTeacherLoggedIn", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Teacher Logged in check. Try later",
      });
    }
  },
};
