require("dotenv").config();

const Itemgroup = require("../model/itemgroup.model");

module.exports = {

    getAllItemgroups: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allItemgroup = await Itemgroup.find({ school: schoolId }).populate("groupId");
            res.status(200).json({ success: true, message: "Success in fetching all  Itemgroup", data: allItemgroup })
        } catch (error) {
            console.log("Error in getAllItemgroup", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Itemgroup. Try later" })
        }

    },
    createItemgroup: (req, res) => {
        const schoolId = req.user.schoolId;
        const newItemgroup = new Itemgroup({ ...req.body, school: schoolId });
        newItemgroup.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Itemgroup is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getItemgroupWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Itemgroup.findOne({ _id: id, school: schoolId }).populate("groupId").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Itemgroup data not Available" })
            }
        }).catch(e => {
            console.log("Error in getItemgroupWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Itemgroup Data" })
        })
    },
    updateItemgroupWithId: async (req, res) => {
        // Not providing the  schoolId as itemgroup Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Itemgroup.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const ItemgroupAfterUpdate = await Itemgroup.findOne({ _id: id }).populate("groupId");
            res.status(200).json({ success: true, message: "Itemgroup Updated", data: ItemgroupAfterUpdate })
        } catch (error) {

            console.log("Error in updateItemgroupWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Itemgroup. Try later" })
        }

    },
    deleteItemgroupWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Itemgroup.findOneAndDelete({ _id: id, school: schoolId });
            const ItemgroupAfterDelete = await Itemgroup.findOne({ _id: id }).populate("groupId");
            res.status(200).json({ success: true, message: "Itemgroup Deleted.", data: ItemgroupAfterDelete })



        } catch (error) {

            console.log("Error in updateItemgroupWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Itemgroup. Try later" })
        }

    },
    getItemgroupWithQuery: async (req, res) => {

        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId, "schoolId")
            filterQuery['school'] = schoolId;
            if (req.query.hasOwnProperty('search')) {
                filterQuery['itemgroup_name'] = { $regex: req.query.search, $options: 'i' }
            }

            if (req.query.hasOwnProperty('groupId')) {
                filterQuery['groupId'] = req.query.groupId
            }



            const filteredItemgroups = await Itemgroup.find(filterQuery).populate("groupId");
            res.status(200).json({ success: true, data: filteredItemgroups })
        } catch (error) {
            console.log("Error in fetching Itemgroup with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Itemgroup  with query." })
        }

    },
}