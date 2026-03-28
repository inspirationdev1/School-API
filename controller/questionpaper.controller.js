const Questionpaper = require('../model/questionpaper.model');
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

module.exports = {



    
    newQuestionpaper: async (req, res) => {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {

                let fileName = null;
                let fileType = "";

                // ✅ Handle file upload (image OR pdf)
                if (files.image && files.image[0]) {

                    const file = files.image[0];
                    const filePath = file.filepath;
                    const originalName = file.originalFilename.replace(/\s/g, "_");

                    // 👉 Detect file type
                    const isPdf = file.mimetype === "application/pdf";

                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: "questionpapers",
                        resource_type: isPdf ? "raw" : "image",  // ⭐ IMPORTANT
                        public_id: Date.now() + "_" + originalName,
                    });

                    fileType = path.extname(originalName); // .pdf / .jpg / .png

                    // ✅ Save in DB
                    fileName = result.secure_url;
                    fileType = fileType;
                }

                const newQuestionpaper = new Questionpaper({
                    name: fields.name[0],
                    description: fields.description[0],
                    date: fields.date[0],
                    subject: fields.subject[0],
                    teacher: fields.teacher[0],
                    class: fields.class[0],
                    examination: fields.examination[0],
                    marksLimit: fields.marksLimit[0],
                    fileName: fileName,
                    fileType: fileType,
                    school: req.user.id
                });

                const savedData = await newQuestionpaper.save();
                res.status(200).json({ success: true, data: savedData, message: "Questionpaper is Added Successfully." });

            } catch (e) {
                console.log("Error in Questionpaper Adding:", e);
                res.status(500).json({ success: false, message: "Failed Adding Questionpaper." });
            }
        });
    },
    getQuestionpaperByClass: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const questionpaper = await Questionpaper.find({ class: req.params.classId, school: schoolId }).populate("class").populate("subject").populate("teacher").populate("subject").populate("examination");
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: questionpaper })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getAllQuestionpapers: async (req, res) => {
        try {
            const questionpapers = await Questionpaper.find().populate("subject").populate("class").populate("teacher").populate("subject").populate("examination");
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: questionpapers })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getQuestionpaperById: async (req, res) => {
        try {
            const questionpaper = await Questionpaper.findOne({ _id: req.params.id })
                .populate("class").populate("subject").populate("teacher").populate("subject").populate("examination");
            res.status(200).json({ success: true, message: "Success in Fetching Single Questionpaper.", data: questionpaper })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Fetching Single Questionpaper, try later." })
        }
    },
    deleteQuestionpaperById: async (req, res) => {
        try {
            await Questionpaper.findOneAndDelete({ _id: req.params.id });
            res.status(200).json({ success: true, message: "Success in Deleting Questionpaper." })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Deleting Questionpaper, try later." })
        }
    },
    updateQuestionpaperWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });

            try {
                const { id } = req.params;
                const questionpaper = await Questionpaper.findById(id);
                if (!questionpaper) return res.status(404).json({ success: false, message: "Questionpaper not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    questionpaper[field] = fields[field][0];
                });


                // ✅ Handle file upload (image OR pdf)
                if (files.image && files.image[0]) {

                    const file = files.image[0];
                    const filePath = file.filepath;
                    const originalName = file.originalFilename.replace(/\s/g, "_");

                    const cleanName = originalName.replace(/\.[^/.]+$/, ""); // remove extension
                    const isPdf = file.mimetype === "application/pdf";
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: "questionpapers",
                        resource_type: "image", // ⭐ FORCE IMAGE
                        format: isPdf ? "pdf" : undefined, // ⭐ IMPORTANT
                        public_id: Date.now() + "_" + cleanName,
                    });

                    // const result = await cloudinary.uploader.upload(filePath, {
                    //     folder: "questionpapers",
                    //     resource_type: isPdf ? "auto" : "image", // ✅ CORRECT
                    //     public_id: Date.now() + "_" + cleanName,
                    // });

                    // const result = await cloudinary.uploader.upload(filePath, {
                    //     folder: "questionpapers",
                    //     resource_type: "auto",
                    //     public_id: Date.now() + "_" + cleanName,
                    // });

                    let fileUrl = result.secure_url;

                    // ✅ FIX: allow PDF preview
                    // if (file.mimetype === "application/pdf") {
                    //     fileUrl = fileUrl.replace("/upload/", "/upload/fl_attachment:false/");
                    // }
                    // if (file.mimetype === "application/pdf") {
                    //     fileUrl = fileUrl.replace("image", "raw");
                    // }

                    let thumbnail = null;

                    // ✅ Generate thumbnail for PDF
                    if (isPdf) {
                        thumbnail = cloudinary.url(result.public_id, {
                            resource_type: "image",   // ⭐ IMPORTANT
                            format: "jpg",
                            page: 1,                  // first page
                            width: 300,
                            crop: "scale",
                        });
                    }

                    // save in DB
                    questionpaper.fileName = result.secure_url;
                    questionpaper.fileType = path.extname(originalName);
                    questionpaper.public_id = result.public_id; // ⭐ VERY IMPORTANT
                    questionpaper.thumbnail = thumbnail;

                    // questionpaper.fileName = fileUrl;
                    // questionpaper.fileType = require("path").extname(originalName);
                }

                await questionpaper.save();
                res.status(200).json({ success: true, message: "Questionpaper updated successfully", data: questionpaper });
            } catch (e) {
                console.log("Error updating Question:", e);
                res.status(500).json({ success: false, message: "Error updating student details." });
            }
        });
    },
    getQuestionpaperWithQuery: async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('class')) {
                filterQuery['class'] = req.query.class
            }

            if (req.query.hasOwnProperty('subject')) {
                filterQuery['subject'] = req.query.subject
            }
            if (req.query.hasOwnProperty('examination')) {
                filterQuery['examination'] = req.query.examination
            }

            const filteredQuestionpapers = await Questionpaper.find(filterQuery);
            res.status(200).json({ success: true, data: filteredQuestionpapers });

        } catch (error) {
            console.log("Error in fetching Employee with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Examinations  with query." })
        }

    },
}