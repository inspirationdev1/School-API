require("dotenv").config();

const Geolocation = require("../model/geolocation.model");

module.exports = {
  getAllGeolocations: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const allGeolocation = await Geolocation.find({
        company: companyId,
      }).populate("linkId");
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Geolocation",
        data: allGeolocation,
      });
    } catch (error) {
      console.log("Error in getAllGeolocation", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Geolocation. Try later",
      });
    }
  },
  createGeolocation: (req, res) => {
    const companyId = req.user.companyId;
    const newGeolocation = new Geolocation({ ...req.body, company: companyId });
    newGeolocation
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);
        res.status(200).json({
          success: true,
          data: savedData,
          message: "Geolocation is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res.status(500).json({ success: false, message: e.message });
      });
  },
  getGeolocationWithId: async (req, res) => {
    const id = req.params.id;
    const companyId = req.user.companyId;
    Geolocation.findOne({ _id: id, company: companyId })
      .populate("linkId")
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Geolocation data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getGeolocationWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Geolocation Data",
        });
      });
  },
  updateGeolocationWithId: async (req, res) => {
    // Not providing the  companyId as geolocation Id will be unique.
    try {
      let id = req.params.id;
      console.log(req.body);
      await Geolocation.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
      );
      const GeolocationAfterUpdate = await Geolocation.findOne({
        _id: id,
      }).populate("linkId");
      res.status(200).json({
        success: true,
        message: "Geolocation Updated",
        data: GeolocationAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateGeolocationWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Geolocation. Try later",
      });
    }
  },
  deleteGeolocationWithId: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      let id = req.params.id;

      await Geolocation.findOneAndDelete({ _id: id, company: companyId });
      const GeolocationAfterDelete = await Geolocation.findOne({
        _id: id,
      }).populate("linkId");
      res.status(200).json({
        success: true,
        message: "Geolocation Deleted.",
        data: GeolocationAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateGeolocationWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Geolocation. Try later",
      });
    }
  },
  getGeolocationWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const companyId = req.user.companyId;
      console.log(companyId, "companyId");
      filterQuery["company"] = companyId;
      if (req.query.hasOwnProperty("search")) {
        filterQuery["geolocation_name"] = {
          $regex: req.query.search,
          $options: "i",
        };
      }

      if (req.query.hasOwnProperty("linkId")) {
        filterQuery["linkId"] = req.query.linkId;
      }

      const filteredGeolocations =
        await Geolocation.find(filterQuery).populate("linkId");
      res.status(200).json({ success: true, data: filteredGeolocations });
    } catch (error) {
      console.log("Error in fetching Geolocation with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Geolocation  with query.",
      });
    }
  },
};
