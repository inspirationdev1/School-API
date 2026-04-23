require("dotenv").config();
const multer = require("multer");
const XLSX = require("xlsx");

const Accountlevel = require("../model/accountlevel.model");
module.exports = {


    upload_accountlevel: async(req, res) => {
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

            const updatedData = sheetData.map(row => ({
                ...row,
                school: schoolId   // 👈 new column
            }));

            // 👉 save to  here
            await Accountlevel.insertMany(updatedData);
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: updatedData, message: "Accountlevel is Uploaded Successfully." })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },



}