const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    employee_name:{type:String, required:true},
    employee_code:{type:String, required:true},
    seq:{type:Number, default:0},
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, default:null},
    year: { type: Number, default: new Date().getFullYear() },
    joinDate: { type: Date, required: true, },
    gender:{type:String, required:true},
    employee_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    phoneno:{type:String, default:null},
    status: {
        type: String,
        required: false,
        default: 'active',
    },
    employeetype: {
        type: String,
        required: false,
        default: 'teaching',
    },
    designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Generalmaster",
            required: false,
            default: null,
        },
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

// ✅ Compound unique index
employeeSchema.index({ school: 1, employee_code: 1 }, { unique: true });
employeeSchema.index({ school: 1, employee_name: 1 }, { unique: true });
module.exports = mongoose.model("Employee", employeeSchema)