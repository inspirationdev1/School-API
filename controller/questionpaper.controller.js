const Questionpaper = require('../model/questionpaper.model');
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");

module.exports = {



    newQuestionpaper: (req, res) => {

        const form = new formidable.IncomingForm({
            multiples: false,
            keepExtensions: true
        });

        form.parse(req, (err, fields, files) => {

            if (err) {
                return res.status(500).send({ success: false, message: "File upload error" });
            }

            let file = files.image?.[0];

            let fileName = "";
            let fileType = "";

            if (file) {

                let oldPath = file.filepath;

                fileName = file.originalFilename.replace(/\s/g, "_");

                fileType = path.extname(fileName); // .pdf / .jpg / .png

                let newPath = path.join(
                    __dirname,
                    "../../frontend/public/uploads/questionpapers/",
                    fileName
                );
                // let newPath = path.join(__dirname, '../../frontend/public/images/uploaded/student', '/', originalFileName);
                // let photoData = fs.readFileSync(oldPath);
                //                     fs.writeFile(newPath, photoData, function (err) {
                console.log("oldPath:", oldPath);
                console.log("newPath:", newPath);
                
                try {
                    fs.copyFileSync(oldPath, newPath);
                    console.log("oldPath:", oldPath);
                    console.log("newPath:", newPath);
                } catch (error) {
                    return res.status(500).send({ success: false, message: error.message });
                }
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

            newQuestionpaper
                .save()
                .then(() => {
                    res.status(200).send({
                        success: true,
                        message: "Questionpaper Added Successfully."
                    });
                })
                .catch((e) => {
                    console.log(e);
                    res.status(500).send({
                        success: false,
                        message: "Failure in Questionpaper."
                    });
                });
        });
    }

    ,
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

        const uploadPath = path.join(
            __dirname,
            "../../frontend/public/uploads/questionpapers"
        );

        const form = new formidable.IncomingForm({
            multiples: false,
            uploadDir: uploadPath,
            keepExtensions: true
        });

        form.parse(req, async (err, fields, files) => {

            if (err) {
                return res.status(400).json({ message: "Error parsing form data." });
            }

            try {

                const { id } = req.params;

                const questionpaper = await Questionpaper.findById(id);

                if (!questionpaper) {
                    return res.status(404).json({ message: "Questionpaper not found." });
                }

                // Update text fields
                Object.keys(fields).forEach((field) => {
                    questionpaper[field] = fields[field][0];
                });

                // Handle File Upload (Image or PDF)
                if (files.image) {

                    const file = files.image[0];

                    // Delete old file
                    const oldFilePath = path.join(
                        uploadPath,
                        questionpaper.fileName || ""
                    );

                    if (questionpaper.fileName && fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }

                    // Prepare new file
                    const oldPath = file.filepath;

                    const originalFileName = file.originalFilename.replace(/\s/g, "_");

                    const newPath = path.join(uploadPath, originalFileName);

                    // Move file
                    fs.renameSync(oldPath, newPath);

                    // Save file info
                    questionpaper.fileName = originalFileName;
                    questionpaper.fileType = path.extname(originalFileName); // .pdf .jpg etc
                }

                await questionpaper.save();

                res.status(200).json({
                    success: true,
                    message: "Questionpaper Updated Successfully"
                });

            } catch (e) {

                console.log(e);

                res.status(500).json({
                    message: "Error updating Questionpaper."
                });

            }

        });
    }

    ,
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