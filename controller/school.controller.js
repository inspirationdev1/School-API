require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWTSECRET;

const School = require("../model/school.model");
const Generalmaster = require("../model/generalmaster.model");
const Employee = require("../model/employee.model");
const Class = require("../model/class.model");
const Section = require("../model/section.model");
const Subject = require("../model/subject.model");
const Department = require("../model/department.model");
const Taxrate = require("../model/taxrate.model");
const Examination = require("../model/examination.model");
const Teacher = require("../model/teacher.model");
const Grade = require("../model/grade.model");
const Feetype = require("../model/feestype.model");
const Feestructure = require("../model/feestructure.model");
const Workingday = require("../model/workingdays.model");
const Classsubject = require("../model/classsubject.model");
const Period = require("../model/period.model");
const Attendee = require("../model/attendee.model");
const Appsetting = require("../model/appsetting.model");
const Parent = require("../model/parent.model");
const Student = require("../model/student.model");
const Accountlevel = require("../model/accountlevel.model");
const Accountledger = require("../model/accountledger.model");
const Accountsetup = require("../model/accountsetup.model");
const Role = require("../model/role.model");
const Numbersequence = require("../model/numberseq.model");
const cloudinary = require("../config/cloudinary");

module.exports = {
  getAllSchools: async (req, res) => {
    try {
      const schools = await School.find().select([
        "-_id",
        "-password",
        "-email",
        "-owner_name",
        "-createdAt",
      ]);
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Schools",
        data: schools,
      });
    } catch (error) {
      console.log("Error in getAllSchools", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Schools. Try later",
      });
    }
  },
  registerSchool: async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const existing = await School.find({ email: fields.email[0] });
        if (existing.length > 0)
          return res
            .status(500)
            .json({ success: false, message: "Email Already Exist!" });

        let photoUrl = null;
        if (files.image && files.image[0]) {
          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "students",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          photoUrl = result.secure_url;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(fields.password[0], salt);

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
          school_image: photoUrl,
        });

        const savedData = await newSchool.save();
        res.status(200).json({
          success: true,
          data: savedData,
          message: "School is Registered Successfully.",
        });
      } catch (e) {
        console.log("Error in Register:", e);
        res.status(500).json({
          success: false,
          message: "Failed Registration." + e.message,
        });
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
              role: "SCHOOL",
            },
            jwtSecret,
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
              role: "SCHOOL",
            },
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Password doesn't match.",
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: "Email not registered.",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  getSchoolOwnData: async (req, res) => {
    const id = req.user.id;
    School.findById(id)
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "School data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getSchoolWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  School Data" });
      });
  },

  updateSchoolWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      console.log(fields);
      if (err) {
        return res
          .status(400)
          .json({ message: "Error parsing the form data." });
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
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          school.school_image = result.secure_url;
          school.public_id = result.public_id;
        }
        // Save the updated school document
        await school.save();

        const dataInfo = await data_Insert(id);
        console.log(dataInfo);

        res
          .status(200)
          .json({ message: "School updated successfully", data: school });
      } catch (e) {
        console.log(e);
        res
          .status(500)
          .json({ message: "Error updating school details." + e.message });
      }
    });
  },
  signOut: async (req, res) => {
    try {
      res.header("Authorization", "");
      // "Authorization"
      res
        .status(200)
        .json({ success: true, messsage: "School Signed Out  Successfully." });
    } catch (error) {
      console.log("Error in Sign out", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Signing Out. Try later",
      });
    }
  },
  isSchoolLoggedIn: async (req, res) => {
    try {
      let token = req.header("Authorization");
      if (token) {
        var decoded = jwt.verify(token, jwtSecret);
        console.log(decoded);
        if (decoded) {
          res.status(200).json({
            success: true,
            data: decoded,
            message: "School is a logged in One",
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
      console.log("Error in isSchoolLoggedIn", error);
      res.status(500).json({
        success: false,
        message: "Server Error in School Logged in check. Try later",
      });
    }
  },
};

const data_Insert = async (schoolId) => {
  try {
    // 3️⃣ Save Accounttransactions

    const deletData_GM = await Generalmaster.deleteMany({
      school: schoolId,
    });
    console.log("deletData_GM", deletData_GM);

    //Bloodgroup
    const bloodGroupData = [
      {
        school: schoolId,
        generalmaster_name: "O Positive",
        generalmaster_code: "O+",
        generalmaster_type: "bloodgroup",
      },
      {
        school: schoolId,
        generalmaster_name: "O Negative",
        generalmaster_code: "O-",
        generalmaster_type: "bloodgroup",
      },
    ];
    const insertedbloodGroup = await Generalmaster.insertMany(bloodGroupData);
    const bloodgroupId = insertedbloodGroup[0]._doc._id;

    //Nationality
    const nationalityData = [
      {
        school: schoolId,
        generalmaster_name: "Indian",
        generalmaster_code: "IND",
        generalmaster_type: "nationality",
      },
      {
        school: schoolId,
        generalmaster_name: "Saudi",
        generalmaster_code: "KSA",
        generalmaster_type: "nationality",
      },
      {
        school: schoolId,
        generalmaster_name: "American",
        generalmaster_code: "USA",
        generalmaster_type: "nationality",
      },
    ];
    const insertedNationality = await Generalmaster.insertMany(nationalityData);
    const nationalityId = insertedNationality[0]._doc._id;
    //Religion
    const religionData = [
      {
        school: schoolId,
        generalmaster_name: "Hindu",
        generalmaster_code: "HINDUISM",
        generalmaster_type: "religion",
      },
      {
        school: schoolId,
        generalmaster_name: "Muslim",
        generalmaster_code: "ISLAM",
        generalmaster_type: "religion",
      },
      {
        school: schoolId,
        generalmaster_name: "Christian",
        generalmaster_code: "CHRISTIANITY",
        generalmaster_type: "religion",
      },
      {
        school: schoolId,
        generalmaster_name: "Sikh",
        generalmaster_code: "SIKHISM",
        generalmaster_type: "religion",
      },
    ];
    const insertedReligion = await Generalmaster.insertMany(religionData);
    const religionId = insertedReligion[0]._doc._id;
    //Mother Tongue
    const motherTongueData = [
      {
        school: schoolId,
        generalmaster_name: "Hindi",
        generalmaster_code: "HIN",
        generalmaster_type: "mothertongue",
      },
      {
        school: schoolId,
        generalmaster_name: "Telugu",
        generalmaster_code: "TEL",
        generalmaster_type: "mothertongue",
      },
      {
        school: schoolId,
        generalmaster_name: "Urdu",
        generalmaster_code: "URD",
        generalmaster_type: "mothertongue",
      },
      {
        school: schoolId,
        generalmaster_name: "Tamil",
        generalmaster_code: "TML",
        generalmaster_type: "mothertongue",
      },
    ];
    const insertedMothertongue =
      await Generalmaster.insertMany(motherTongueData);
    const mothertongueId = insertedMothertongue[0]._doc._id;
    //First Language
    const firstLanguageData = [
      {
        school: schoolId,
        generalmaster_name: "Hindi",
        generalmaster_code: "HIN_LANG",
        generalmaster_type: "firstlanguage",
      },
      {
        school: schoolId,
        generalmaster_name: "Telugu",
        generalmaster_code: "TEL_LANG",
        generalmaster_type: "firstlanguage",
      },
      {
        school: schoolId,
        generalmaster_name: "Urdu",
        generalmaster_code: "URD_LANG",
        generalmaster_type: "firstlanguage",
      },
      {
        school: schoolId,
        generalmaster_name: "English",
        generalmaster_code: "ENG_LANG",
        generalmaster_type: "firstlanguage",
      },
    ];
    const insertedFirstlanguage =
      await Generalmaster.insertMany(firstLanguageData);
    const firstlanguageId = insertedFirstlanguage[0]._doc._id;
    //Mode of Transport
    const modeOfTransportData = [
      {
        school: schoolId,
        generalmaster_name: "Parent",
        generalmaster_code: "Parent",
        generalmaster_type: "modeoftransport",
      },
      {
        school: schoolId,
        generalmaster_name: "SchoolBus",
        generalmaster_code: "School",
        generalmaster_type: "modeoftransport",
      },
      {
        school: schoolId,
        generalmaster_name: "Auto",
        generalmaster_code: "Auto",
        generalmaster_type: "modeoftransport",
      },
      {
        school: schoolId,
        generalmaster_name: "Other",
        generalmaster_code: "Other",
        generalmaster_type: "modeoftransport",
      },
    ];
    const insertedTransport =
      await Generalmaster.insertMany(modeOfTransportData);
    const transportId = insertedTransport[0]._doc._id;
    //Designation
    const designationData = [
      {
        school: schoolId,
        generalmaster_name: "Teacher",
        generalmaster_code: "Teacher-001",
        generalmaster_type: "designation",
      },
    ];
    const insertedDesignation = await Generalmaster.insertMany(designationData);
    const designationId = insertedDesignation[0]._doc._id;

    //Class Data

    const deletData_class = await Class.deleteMany({
      school: schoolId,
    });
    console.log("deletData_class", deletData_class);

    const classData = [
      {
        school: schoolId,
        class_name: "10th",
        class_code: "10",
        class_type: "class",
      },
    ];
    const insertedClass = await Class.insertMany(classData);

    //Section Data

    const deletData_section = await Section.deleteMany({
      school: schoolId,
    });
    console.log("deletData_section", deletData_section);

    const sectionData = [
      {
        school: schoolId,
        section_name: "Sec A",
        section_code: "001",
      },
      {
        school: schoolId,
        section_name: "Sec B",
        section_code: "002",
      },
    ];
    const insertedSection = await Section.insertMany(sectionData);

    //Subject Data

    const deletData_subject = await Subject.deleteMany({
      school: schoolId,
    });
    console.log("deletData_subject", deletData_subject);

    const subjectData = [
      {
        school: schoolId,
        subject_name: "Hindi",
        subject_code: "Hindi-001",
        seq: "1",
      },
      {
        school: schoolId,
        subject_name: "Telugu",
        subject_code: "Telugu-001",
        seq: "2",
      },
      {
        school: schoolId,
        subject_name: "English",
        subject_code: "English-001",
        seq: "3",
      },
    ];
    const insertedsubject = await Subject.insertMany(subjectData);

    //Department Data

    const deletData_department = await Department.deleteMany({
      school: schoolId,
    });
    console.log("deletData_department", deletData_department);

    const departmentData = [
      {
        school: schoolId,
        department_name: "Teaching",
        department_code: "Teaching-001",
      },
      {
        school: schoolId,
        department_name: "Admin",
        department_code: "Admin-002",
      },
      {
        school: schoolId,
        department_name: "House Keeping",
        department_code: "HouseKeeping-003",
      },
      {
        school: schoolId,
        department_name: "Security",
        department_code: "Security-004",
      },
    ];
    const insertedDepartment = await Department.insertMany(departmentData);

    //Working Days Data
    const deletData_workingdays = await Workingday.deleteMany({
      school: schoolId,
    });
    console.log("deletData_workingdays", deletData_workingdays);
    const workingdaysData = [
      {
        school: schoolId,
        year: "2026",
        month: "6",
        month_name: "June",
        work_days: "22",
        seq: "1",
      },
      {
        school: schoolId,
        year: "2026",
        month: "7",
        month_name: "July",
        work_days: "23",
        seq: "2",
      },
    ];
    const insertedWorkingdays = await Workingday.insertMany(workingdaysData);

    //Tax Rate Data

    const deletData_taxrate = await Taxrate.deleteMany({
      school: schoolId,
    });
    console.log("deletData_taxrate", deletData_taxrate);

    const taxRateData = [
      {
        school: schoolId,
        tax_code: "ETR-001",
        tax_name: "Inclusive Tax Rate",
        tax_percent: "18",
        taxtype: "inclusive",
      },
      {
        school: schoolId,
        tax_code: "ETR-002",
        tax_name: "Exclusive Tax Rate",
        tax_percent: "0",
        taxtype: "exclusive",
      },
    ];
    const taxrateInserted = await Taxrate.insertMany(taxRateData);

    //Examination Data

    const deletData_examination = await Examination.deleteMany({
      school: schoolId,
    });
    console.log("deletData_examination", deletData_examination);

    const examinationData = [
      {
        school: schoolId,
        examNo: "1",
        examination_name: "FA-1",
        examination_code: "FA1-001",
        seq: "1",
      },
      {
        school: schoolId,
        examNo: "2",
        examination_name: "FA-2",
        examination_code: "FA2-002",
        seq: "2",
      },
    ];
    await Examination.insertMany(examinationData);

    //Grades Data

    const deletData_grade = await Grade.deleteMany({
      school: schoolId,
    });
    console.log("deletData_grade", deletData_grade);

    const gradeData = [
      {
        school: schoolId,
        grade_code: "A1",
        marks_limit: "20",
        marks_max: "20",
        marks_min: "19",
        gpa: "10",
      },
      {
        school: schoolId,
        grade_code: "A2",
        marks_limit: "20",
        marks_max: "18",
        marks_min: "17",
        gpa: "9",
      },
    ];
    await Grade.insertMany(gradeData);

    //Fee Type Data
    console.log(taxrateInserted);
    const taxrate = taxrateInserted[0]._doc._id;
    const tax_percent = taxrateInserted[0]._doc.tax_percent;
    const taxtype = taxrateInserted[0]._doc.taxtype;

    console.log(taxrate);
    const deletData_feetype = await Feetype.deleteMany({
      school: schoolId,
    });
    console.log("deletData_feetype", deletData_feetype);

    const feetypeData = [
      {
        school: schoolId,
        feestype_name: "Tuition Fee",
        feestype_code: "001",
        taxrate: taxrate,
        taxtype: taxtype,
        tax_percent: tax_percent,
      },
      {
        school: schoolId,
        feestype_name: "Transport Fee",
        feestype_code: "002",
        taxrate: taxrate,
        taxtype: taxtype,
        tax_percent: tax_percent,
      },
      {
        school: schoolId,
        feestype_name: "Remedial Class Fee",
        feestype_code: "003",
        taxrate: taxrate,
        taxtype: taxtype,
        tax_percent: tax_percent,
      },
    ];
    const insertedFeeType = await Feetype.insertMany(feetypeData);

    // FEE Structure

    console.log(insertedClass);
    const classId = insertedClass[0]._doc._id;
    const className = insertedClass[0]._doc.class_name;
    const feeTypeId = insertedFeeType[0]._doc._id;
    // const taxrate = taxrateInserted[0]._doc._id;
    // const tax_percent = taxrateInserted[0]._doc.tax_percent;
    // const taxtype = taxrateInserted[0]._doc.taxtype;

    // console.log(taxrate);
    const deletData_Feestructure = await Feestructure.deleteMany({
      school: schoolId,
    });
    console.log("deletData_Feestructure", deletData_Feestructure);

    const feeStructureData = [
      {
        school: schoolId,
        name: className + " Tuition Fee",
        code: "001",
        class: classId,
        feestype: feeTypeId,
        taxrate: taxrate,
        taxtype: taxtype,
        tax_percent: tax_percent,
        amount: "3000",
      },
    ];
    await Feestructure.insertMany(feeStructureData);

    //Class Subject Data

    const subjectId = insertedsubject[0]._doc._id;
    const deletData_classsubject = await Classsubject.deleteMany({
      school: schoolId,
    });
    console.log("deletData_classsubject", deletData_classsubject);

    const class_name = insertedClass[0]._doc.class_name;
    const subject_name = insertedsubject[0]._doc.subject_name;

    const classsubjectData = [
      {
        school: schoolId,
        class: classId,
        class_name: class_name,
        subject: subjectId,
        subject_name: subject_name,
        seq: "1",
      },
    ];
    const classsubjectInserted =
      await Classsubject.insertMany(classsubjectData);

    //Employee Data
    const deletData_employee = await Employee.deleteMany({
      school: schoolId,
    });
    console.log("deletData_employee", deletData_employee);

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync("12345678", salt);
    // const currentYear = new Date().getFullYear();
    const employeeData = [
      {
        school: schoolId,
        email: "teacher1@gmail.com",
        employee_name: "teacher1",
        employee_code: "teacher-001",
        seq: "1",
        qualification: "M.A.English",
        dOBDate: Date.now(),
        year: new Date().getFullYear(),
        age: "0",
        joinDate: Date.now(),
        gender: "female",
        employee_image:
          "https://res.cloudinary.com/da3dxqer8/image/upload/v1788336404/teachers/1788336403992_teacher2.jpg.jpg",
        public_id: " ",
        phoneno: "1234567898",
        designation: designationId,
        status: "active",
        employeetype: "teaching",
        password: hashPassword,
      },
    ];
    const insertedEmployee = await Employee.insertMany(employeeData);

    //Teacher Data
    const employeeId = insertedEmployee[0]._doc._id;

    const deletData_teacher = await Teacher.deleteMany({
      school: schoolId,
    });
    console.log("deletData_teacher", deletData_teacher);

    const teacherData = [
      {
        school: schoolId,
        email: "teacher1@gmail.com",
        name: "teacher1",
        teacher_code: "teacher-001",
        seq: "1",
        qualification: "M.A.English",
        dOBDate: Date.now(),
        year: new Date().getFullYear(),
        age: "35",
        joinDate: Date.now(),
        gender: "female",
        teacher_image:
          "https://res.cloudinary.com/da3dxqer8/image/upload/v1788336404/teachers/1788336403992_teacher2.jpg.jpg",
        public_id: " ",
        phoneno: "1234567898",
        designation: designationId,
        status: "active",
        employee_id: employeeId,
        password: hashPassword,
      },
    ];
    const insertedTeacher = await Teacher.insertMany(teacherData);

    //Period Data
    const sectionId = insertedSection[0]._doc._id;
    const teacherId = insertedTeacher[0]._doc._id;

    const deletData_period = await Period.deleteMany({
      school: schoolId,
    });
    console.log("deletData_period", deletData_period);

    const periodData = [
      {
        school: schoolId,
        teacher: teacherId,
        subject: subjectId,
        class: classId,
        section: sectionId,
        period_code: "001",
        period_name: "1st Period",
        starttime: "08:00",
        endtime: "09:00",
        startminutes: "480",
        endminutes: "540",
        timeseq: "480",
        subjectkey: "subject1",
        days: ["Monday", "Tuesday", "Wednesday"],
      },
    ];
    const insertedPeriod = await Period.insertMany(periodData);

    //Attendee Data

    const deletData_attendee = await Period.deleteMany({
      school: schoolId,
    });
    console.log("deletData_attendee", deletData_attendee);

    const attendeeData = [
      {
        school: schoolId,
        teacher: teacherId,
        class: classId,
        section: sectionId,
      },
    ];
    const insertedAttendee = await Attendee.insertMany(attendeeData);

    //App Settings Data
    const deletData_appsetting = await Appsetting.deleteMany({
      school: schoolId,
    });
    console.log("deletData_appsetting", deletData_appsetting);
    const appsettingData = [
      {
        school: schoolId,
        appsetting_name: "App1",
        appsetting_code: "001",
        udise_no: "123456789",
        discPerAllowed: "100",
        print_tax: true,
        report_image: "",
        toolbar_image: "",
        toolbar_public_id: "",
      },
    ];
    const insertedAppsetting = await Appsetting.insertMany(appsettingData);

    // Parent Data

    const deletData_parent = await Parent.deleteMany({
      school: schoolId,
    });
    console.log("deletData_parent", deletData_parent);
    const parentData = [
      {
        school: schoolId,
        email: "parent1@gmail.com",
        name: "parent1",
        father_name: "father1",
        mother_name: "mother1",
        parent_code: "001",
        seq: "1",
        qualification: "Masters",
        dOBDate: Date.now(),
        age: "0",
        joinDate: Date.now(),
        year: new Date().getFullYear(),
        gender: "male",
        parent_image:
          "https://res.cloudinary.com/da3dxqer8/image/upload/v1788336404/teachers/1788336403992_teacher2.jpg.jpg",
        public_id: "",
        phoneno: "2345678987",
        aadhar_no: "234567898789",
        createdAt: new Date(),
        password: hashPassword,
      },
    ];
    const insertedParent = await Parent.insertMany(parentData);

    // Student Data

    const parentId = insertedParent[0]._doc._id;
    const fatherName = insertedParent[0]._doc.father_name;
    const deletData_student = await Student.deleteMany({
      school: schoolId,
    });
    console.log("deletData_student", deletData_student);
    const studentData = [
      {
        school: schoolId,
        email: "student1@gmail.com",
        name: "student1",
        student_code: "001",
        seq: "1",
        student_class: classId,
        class_name: className,
        section: sectionId,
        parent: parentId,
        dOBDate: Date.now(),
        age: "0",
        joinDate: Date.now(),
        year: new Date().getFullYear(),
        gender: "male",
        status: "active",
        guardian: "guardian_sample",
        guardian_phone: "5555554567",
        pen_no: "45678",
        aadhar_no: "123456789878",
        roll_no: "12",
        admission_no: "12345",
        student_image:
          "https://res.cloudinary.com/da3dxqer8/image/upload/v1788336404/teachers/1788336403992_teacher2.jpg.jpg",
        public_id: "",
        image: "",
        bloodgroup: bloodgroupId,
        vaccinated: "yes",
        nationality: nationalityId,
        religion: religionId,
        mothertongue: mothertongueId,
        identificationmark1: "",
        identificationmark2: "",
        permanentaddress: "",
        permanentpincode: "",
        presentaddress: "",
        presentpincode: "",
        modeoftransport: transportId,
        nameofpreviousschool: "",
        classpassed: "",
        yearofpassing: "",
        reasonforleaving: "",
        studentexpelledleaving: "",
        mediumofinstructions: "",
        firstlanguage: firstlanguageId,
        siblingstudingname: "",
        siblingapplyingname: "",
        siblingstudingclass: "",
        siblingapplyingclass: "",
        previouslyapplied: "",
        admissionintoclass: "",
        dateofaddmission: new Date(),
        password: hashPassword,
        createdAt: new Date(),
      },
    ];
    const insertedStudent = await Student.insertMany(studentData);

    //Level 1 Data

    const deletData_Accountlevel = await Accountlevel.deleteMany({
      school: schoolId,
    });

    const level_1_Data = [
      {
        school: schoolId,
        accountlevel_name: "Asset",
        accountlevel_code: "1000",
        seq: "1",
        groupId: null,
        level: "1",
        account_type: "asset",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Liability",
        accountlevel_code: "2000",
        seq: "2",
        groupId: null,
        level: "1",
        account_type: "liability",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Equity (3000)",
        accountlevel_code: "3000",
        seq: "3",
        groupId: null,
        level: "1",
        account_type: "equity",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Income",
        accountlevel_code: "4000",
        seq: "4",
        groupId: null,
        level: "1",
        account_type: "income",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Expense",
        accountlevel_code: "5000",
        seq: "5",
        groupId: null,
        level: "1",
        account_type: "expense",
        status: "active",
      },
    ];
    const insertedlevel_1 = await Accountlevel.insertMany(level_1_Data);
    // const level_1_Id = insertedlevel_1[0]._doc._id;
    const arrangedLevel1 = insertedlevel_1
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedLevel1);

    const level_2_Data = [
      {
        school: schoolId,
        accountlevel_name: "Current Asset",
        accountlevel_code: "1100",
        seq: "1",
        group_code: "1000",
        groupId: null,
        level: "2",
        account_type: "asset",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Fixed Asset",
        accountlevel_code: "1200",
        seq: "2",
        group_code: "1000",
        groupId: null,
        level: "2",
        account_type: "asset",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Current Liablities",
        accountlevel_code: "2100",
        seq: "1",
        group_code: "2000",
        groupId: null,
        level: "2",
        account_type: "liability",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Long Term Liblities",
        accountlevel_code: "2200",
        seq: "2",
        group_code: "2000",
        groupId: null,
        level: "2",
        account_type: "liability",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Capital (3100)",
        accountlevel_code: "3100",
        seq: "1",
        group_code: "3000",
        groupId: null,
        level: "2",
        account_type: "equity",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Reserves (3200)",
        accountlevel_code: "3200",
        seq: "2",
        group_code: "3000",
        groupId: null,
        level: "2",
        account_type: "equity",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Fee Income (4100)",
        accountlevel_code: "4100",
        seq: "1",
        group_code: "4000",
        groupId: null,
        level: "2",
        account_type: "income",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Other Income (4200)",
        accountlevel_code: "4200",
        seq: "2",
        group_code: "4000",
        groupId: null,
        level: "2",
        account_type: "income",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Salary Expenses (5100)",
        accountlevel_code: "5100",
        seq: "1",
        group_code: "5000",
        groupId: null,
        level: "2",
        account_type: "expense",
        status: "active",
      },
      {
        school: schoolId,
        accountlevel_name: "Administrative Expenses (5200)",
        accountlevel_code: "5200",
        seq: "2",
        group_code: "5000",
        groupId: null,
        level: "2",
        account_type: "expense",
        status: "active",
      },
    ];

    for (const item of level_2_Data) {
      const parentLevel1 = arrangedLevel1.find(
        (level1) => level1.accountlevel_code === item.group_code,
      );

      if (parentLevel1) {
        item.groupId = parentLevel1._id;
      }
    }

    const insertedlevel_2 = await Accountlevel.insertMany(level_2_Data);
    const arrangedLevel2 = insertedlevel_2
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedLevel2);

    const level_3_Data = [
      // ASSETS
      {
        accountlevel_code: "1110",
        accountlevel_name: "Cash & Bank (1110)",
        group_code: "1100",
        level: 3,
        account_type: "asset",
      },
      {
        accountlevel_code: "1120",
        accountlevel_name: "Accounts Receivable (1120)",
        group_code: "1100",
        level: 3,
        account_type: "asset",
      },
      {
        accountlevel_code: "1210",
        accountlevel_name: "Buildings (1210)",
        group_code: "1200",
        level: 3,
        account_type: "asset",
      },
      {
        accountlevel_code: "1220",
        accountlevel_name: "Vehicles (1220)",
        group_code: "1200",
        level: 3,
        account_type: "asset",
      },

      // LIABILITIES
      {
        accountlevel_code: "2110",
        accountlevel_name: "Accounts Payable (2110)",
        group_code: "2100",
        level: 3,
        account_type: "liability",
      },
      {
        accountlevel_code: "2120",
        accountlevel_name: "GST Payable (2120)",
        group_code: "2100",
        level: 3,
        account_type: "liability",
      },
      {
        accountlevel_code: "2210",
        accountlevel_name: "Loans (2210)",
        group_code: "2200",
        level: 3,
        account_type: "liability",
      },

      // EQUITY
      {
        accountlevel_code: "3110",
        accountlevel_name: "Share Capital (3110)",
        group_code: "3100",
        level: 3,
        account_type: "equity",
      },
      {
        accountlevel_code: "3210",
        accountlevel_name: "Retained Earnings (3210)",
        group_code: "3200",
        level: 3,
        account_type: "equity",
      },

      // INCOME
      {
        accountlevel_code: "4110",
        accountlevel_name: "Academic Fees (4110)",
        group_code: "4100",
        level: 3,
        account_type: "income",
      },
      {
        accountlevel_code: "4120",
        accountlevel_name: "Transport Fees (4120)",
        group_code: "4100",
        level: 3,
        account_type: "income",
      },
      {
        accountlevel_code: "4210",
        accountlevel_name: "Interest Income (4210)",
        group_code: "4200",
        level: 3,
        account_type: "income",
      },

      // EXPENSES
      {
        accountlevel_code: "5110",
        accountlevel_name: "Teaching Staff (5110)",
        group_code: "5100",
        level: 3,
        account_type: "expense",
      },
      {
        accountlevel_code: "5120",
        accountlevel_name: "Non Teaching Staff (5120)",
        group_code: "5100",
        level: 3,
        account_type: "expense",
      },
      {
        accountlevel_code: "5210",
        accountlevel_name: "Utilities (5210)",
        group_code: "5200",
        level: 3,
        account_type: "expense",
      },
      {
        accountlevel_code: "5220",
        accountlevel_name: "Office Expenses (5220)",
        group_code: "5200",
        level: 3,
        account_type: "expense",
      },
    ];

    for (const item of level_3_Data) {
      item.school = schoolId;
      const parentLevel2 = arrangedLevel2.find(
        (level2) => level2.accountlevel_code === item.group_code,
      );

      if (parentLevel2) {
        item.groupId = parentLevel2._id;
      }
    }

    const insertedlevel_3 = await Accountlevel.insertMany(level_3_Data);
    const arrangedLevel3 = insertedlevel_3
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedLevel3);

    // Level4

    const level_4_Data = [
      // ASSETS
      {
        accountlevel_code: "1111",
        accountlevel_name: "Bank Accounts (1111)",
        group_code: "1110",
        level: 4,
        account_type: "asset",
      },
      {
        accountlevel_code: "1112",
        accountlevel_name: "Cash Accounts (1112)",
        group_code: "1110",
        level: 4,
        account_type: "asset",
      },
      {
        accountlevel_code: "1121",
        accountlevel_name: "Student Receivables (1121)",
        group_code: "1120",
        level: 4,
        account_type: "asset",
      },
      {
        accountlevel_code: "1211",
        accountlevel_name: "School Buildings (1211)",
        group_code: "1210",
        level: 4,
        account_type: "asset",
      },
      {
        accountlevel_code: "1221",
        accountlevel_name: "School Buses (1221)",
        group_code: "1220",
        level: 4,
        account_type: "asset",
      },

      // LIABILITIES
      {
        accountlevel_code: "2111",
        accountlevel_name: "Vendor Payables (2111)",
        group_code: "2110",
        level: 4,
        account_type: "liability",
      },
      {
        accountlevel_code: "2121",
        accountlevel_name: "Output GST (2121)",
        group_code: "2120",
        level: 4,
        account_type: "liability",
      },
      {
        accountlevel_code: "2211",
        accountlevel_name: "Bank Loans (2211)",
        group_code: "2210",
        level: 4,
        account_type: "liability",
      },

      // CAPITAL
      {
        accountlevel_code: "3111",
        accountlevel_name: "Equity Shares (3111)",
        group_code: "3110",
        level: 4,
        account_type: "capital",
      },
      {
        accountlevel_code: "3211",
        accountlevel_name: "Current Year Profit (3211)",
        group_code: "3210",
        level: 4,
        account_type: "capital",
      },

      // INCOME
      {
        accountlevel_code: "4111",
        accountlevel_name: "Tuition Fees (4111)",
        group_code: "4110",
        level: 4,
        account_type: "income",
      },
      {
        accountlevel_code: "4112",
        accountlevel_name: "Admission Fees (4112)",
        group_code: "4110",
        level: 4,
        account_type: "income",
      },
      {
        accountlevel_code: "4121",
        accountlevel_name: "Bus Fees (4121)",
        group_code: "4120",
        level: 4,
        account_type: "income",
      },
      {
        accountlevel_code: "4211",
        accountlevel_name: "Bank Interest (4211)",
        group_code: "4210",
        level: 4,
        account_type: "income",
      },

      // EXPENSES
      {
        accountlevel_code: "5111",
        accountlevel_name: "Teachers Salary (5111)",
        group_code: "5110",
        level: 4,
        account_type: "expense",
      },
      {
        accountlevel_code: "5121",
        accountlevel_name: "Admin Salary (5121)",
        group_code: "5120",
        level: 4,
        account_type: "expense",
      },
      {
        accountlevel_code: "5211",
        accountlevel_name: "Electricity (5211)",
        group_code: "5210",
        level: 4,
        account_type: "expense",
      },
      {
        accountlevel_code: "5212",
        accountlevel_name: "Internet (5212)",
        group_code: "5210",
        level: 4,
        account_type: "expense",
      },
      {
        accountlevel_code: "5221",
        accountlevel_name: "Stationery (5221)",
        group_code: "5220",
        level: 4,
        account_type: "expense",
      },
    ];

    for (const item of level_4_Data) {
      item.school = schoolId;
      const parentLevel3 = arrangedLevel3.find(
        (level3) => level3.accountlevel_code === item.group_code,
      );

      if (parentLevel3) {
        item.groupId = parentLevel3._id;
      }
    }

    const insertedlevel_4 = await Accountlevel.insertMany(level_4_Data);
    const arrangedLevel4 = insertedlevel_4
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedLevel4);

    //level 5
    const deletData_Accountledger = await Accountledger.deleteMany({
      school: schoolId,
    });
    const level_5_Data = [
      // ASSETS
      {
        accountledger_code: "111101",
        accountledger_name: "SBI Current A/c (111101)",
        group_code: "1111",
        level: 5,
        account_type: "asset",
      },
      {
        accountledger_code: "111102",
        accountledger_name: "HDFC Current A/c (111102)",
        group_code: "1111",
        level: 5,
        account_type: "asset",
      },
      {
        accountledger_code: "111201",
        accountledger_name: "Cash In Hand (111201)",
        group_code: "1112",
        level: 5,
        account_type: "asset",
      },
      {
        accountledger_code: "112101",
        accountledger_name: "Tuition Fees Receivable (112101)",
        group_code: "1121",
        level: 5,
        account_type: "asset",
      },
      {
        accountledger_code: "121101",
        accountledger_name: "Main School Building (121101)",
        group_code: "1211",
        level: 5,
        account_type: "asset",
      },
      {
        accountledger_code: "122101",
        accountledger_name: "Bus No 1 (122101)",
        group_code: "1221",
        level: 5,
        account_type: "asset",
      },

      // LIABILITIES
      {
        accountledger_code: "211101",
        accountledger_name: "ABC Suppliers (211101)",
        group_code: "2111",
        level: 5,
        account_type: "liability",
      },
      {
        accountledger_code: "211102",
        accountledger_name: "XYZ Stationers (211102)",
        group_code: "2111",
        level: 5,
        account_type: "liability",
      },
      {
        accountledger_code: "212101",
        accountledger_name: "CGST Payable (212101)",
        group_code: "2121",
        level: 5,
        account_type: "liability",
      },
      {
        accountledger_code: "212102",
        accountledger_name: "SGST Payable (212102)",
        group_code: "2121",
        level: 5,
        account_type: "liability",
      },
      {
        accountledger_code: "221101",
        accountledger_name: "SBI Term Loan (221101)",
        group_code: "2211",
        level: 5,
        account_type: "liability",
      },

      // CAPITAL
      {
        accountledger_code: "311101",
        accountledger_name: "Paid Up Capital (311101)",
        group_code: "3111",
        level: 5,
        account_type: "capital",
      },
      {
        accountledger_code: "321101",
        accountledger_name: "Net Profit Transfer (321101)",
        group_code: "3211",
        level: 5,
        account_type: "capital",
      },

      // INCOME
      {
        accountledger_code: "411101",
        accountledger_name: "Class Tuition Fee (411101)",
        group_code: "4111",
        level: 5,
        account_type: "income",
      },
      {
        accountledger_code: "411201",
        accountledger_name: "Admission Fee Income (411201)",
        group_code: "4112",
        level: 5,
        account_type: "income",
      },
      {
        accountledger_code: "412101",
        accountledger_name: "School Bus Fee Income (412101)",
        group_code: "4121",
        level: 5,
        account_type: "income",
      },
      {
        accountledger_code: "421101",
        accountledger_name: "Savings Interest Income (421101)",
        group_code: "4211",
        level: 5,
        account_type: "income",
      },

      // EXPENSES
      {
        accountledger_code: "511101",
        accountledger_name: "Primary Teachers Salary (511101)",
        group_code: "5111",
        level: 5,
        account_type: "expense",
      },
      {
        accountledger_code: "511102",
        accountledger_name: "Secondary Teachers Salary (511102)",
        group_code: "5111",
        level: 5,
        account_type: "expense",
      },
      {
        accountledger_code: "512101",
        accountledger_name: "Office Staff Salary (512101)",
        group_code: "5121",
        level: 5,
        account_type: "expense",
      },
      {
        accountledger_code: "521101",
        accountledger_name: "Electricity Charges (521101)",
        group_code: "5211",
        level: 5,
        account_type: "expense",
      },
      {
        accountledger_code: "521201",
        accountledger_name: "Broadband Charges (521201)",
        group_code: "5212",
        level: 5,
        account_type: "expense",
      },
      {
        accountledger_code: "522101",
        accountledger_name: "School Stationery Expense (522101)",
        group_code: "5221",
        level: 5,
        account_type: "expense",
      },
    ];

    for (const item of level_5_Data) {
      item.school = schoolId;
      const parentLevel4 = arrangedLevel4.find(
        (level4) => level4.accountlevel_code === item.group_code,
      );

      if (parentLevel4) {
        item.groupId = parentLevel4._id;
      }
    }

    const insertedlevel_5 = await Accountledger.insertMany(level_5_Data);
    const arrangedLevel5 = insertedlevel_5
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedLevel5);

    // Account setup

    const deletData_Accountsetup = await Accountsetup.deleteMany({
      school: schoolId,
    });
    const accountsetup_Data = [
      //Salesinvoice
      {
        screen: "salesinvoice",
        screen_name: "Sales Invoice",
        accountledger_code: "112101",
        accountledger_name: "Tuition Fees Receivable",
        amount_type: "dr",
        account_type: "asset",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "1",
      },
      {
        screen: "salesinvoice",
        screen_name: "Sales Invoice",
        accountledger_code: "411101",
        accountledger_name: "Class Tuition Fee",
        amount_type: "cr",
        account_type: "income",
        mapping_type: "taxable_amount",
        paymentMethod: "cash",
        seq: "2",
      },
      {
        screen: "salesinvoice",
        screen_name: "Sales Invoice",
        accountledger_code: "212101",
        accountledger_name: "CGST Payable",
        amount_type: "cr",
        account_type: "liablity",
        mapping_type: "tax_amount",
        paymentMethod: "cash",
        seq: "3",
      },
      {
        screen: "salesinvoice",
        screen_name: "Sales Invoice",
        accountledger_code: "212102",
        accountledger_name: "SGST Payable",
        amount_type: "cr",
        account_type: "liablity",
        mapping_type: "tax_amount",
        paymentMethod: "cash",
        seq: "4",
      },
      //Receipts
      {
        screen: "receipt",
        screen_name: "Receipt",
        accountledger_code: "111201",
        accountledger_name: "Cash In Hand",
        amount_type: "dr",
        account_type: "asset",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "1",
      },
      {
        screen: "receipt",
        screen_name: "Receipt",
        accountledger_code: "112101",
        accountledger_name: "Tuition Fees Receivable",
        amount_type: "cr",
        account_type: "asset",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "2",
      },
      //Expenses
      {
        screen: "expense",
        screen_name: "Expense",
        accountledger_code: "521101",
        accountledger_name: "Electricity Charges",
        amount_type: "dr",
        account_type: "expense",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "1",
      },
      {
        screen: "expense",
        screen_name: "Expense",
        accountledger_code: "111101",
        accountledger_name: "SBI Current A/c",
        amount_type: "cr",
        account_type: "asset",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "2",
      },
      // Payments

      {
        screen: "payment",
        screen_name: "Payment",
        accountledger_code: "211101",
        accountledger_name: "ABC Suppliers",
        amount_type: "dr",
        account_type: "liablity",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "1",
      },
      {
        screen: "payment",
        screen_name: "Payment",
        accountledger_code: "111101",
        accountledger_name: "SBI Current A/c",
        amount_type: "cr",
        account_type: "asset",
        mapping_type: "net_amount",
        paymentMethod: "cash",
        seq: "2",
      },
    ];

    for (const item of accountsetup_Data) {
      item.school = schoolId;
      const parentLevel5 = arrangedLevel5.find(
        (level5) => level5.accountledger_code === item.accountledger_code,
      );

      if (parentLevel5) {
        item.accountledger = parentLevel5._id;
      }
    }

    const insertedAccountsetup =
      await Accountsetup.insertMany(accountsetup_Data);
    const arrangedAccountsetup = insertedAccountsetup
      .map((item) => item.toObject())
      .sort((a, b) => Number(a.seq) - Number(b.seq));

    console.log(arrangedAccountsetup);

    // Role data
    const deletData_role = await Role.deleteMany({
      school: schoolId,
    });
    console.log("deletData_role", deletData_role);

    const roleData = [
      {
        school: schoolId,
        role_name: "teacher",
        role_code: "001",
        roleType: "teacher_role",
      },
      {
        school: schoolId,
        role_name: "student",
        role_code: "002",
        roleType: "student_role",
      },
      {
        school: schoolId,
        role_name: "user",
        role_code: "003",
        roleType: "user_role",
      },
    ];
    const insertedRole = await Role.insertMany(roleData);

    // Number sequence

    const deletData_numbersequence = await Numbersequence.deleteMany({
      school: schoolId,
    });
    console.log("deletData_numbersequence", deletData_numbersequence);

    const numbersequenceData = [
      {
        school: schoolId,
        numberseq_name: "Student",
        screen: "student",
        prefix: "",
        suffix: "",
        seq: "2",
      },
      {
        school: schoolId,
        numberseq_name: "Parent",
        screen: "parent",
        prefix: "",
        suffix: "",
        seq: "2",
      },
      {
        school: schoolId,
        numberseq_name: "Teacher",
        screen: "teacher",
        prefix: "",
        suffix: "",
        seq: "2",
      },
      {
        school: schoolId,
        numberseq_name: "User",
        screen: "user",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Sales Invoice",
        screen: "salesinvoice",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Receipt",
        screen: "receipt",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Payment",
        screen: "payment",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Expense",
        screen: "expense",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Marksheet",
        screen: "marksheet",
        prefix: "",
        suffix: "",
        seq: "1",
      },
      {
        school: schoolId,
        numberseq_name: "Employee",
        screen: "employee",
        prefix: "",
        suffix: "",
        seq: "2",
      },
      {
        school: schoolId,
        numberseq_name: "Journal Voucher",
        screen: "journalvoucher",
        prefix: "",
        suffix: "",
        seq: "1",
      },
    ];
    const insertedNumbersequence =
      await Numbersequence.insertMany(numbersequenceData);

    return { message: "Data inserted successfully", success: true };
  } catch (error) {
    return { message: error.message, success: false };
  }
};
