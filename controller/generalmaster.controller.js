require("dotenv").config();
// import redisClient from "../config/redis.js";
const { redisClient } = require("../config/redis.js");

const Generalmaster = require("../model/generalmaster.model");

module.exports = {
  getAllGeneralmasters: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const cacheKey = `generalmasters:${schoolId}`;
      let cachedData = null;
      if (redisClient.isReady) {
        // 1. Check Redis
        cachedData = await redisClient.get(cacheKey);
      }

      if (cachedData) {
        console.log("Redis Cache HIT");
        return res.status(200).json({
          success: true,
          source: "redis",
          message: "Success in fetching all  Generalmaster",
          data: JSON.parse(cachedData),
        });
      }
      console.log("Redis Cache MISS");

      const allGeneralmaster = await Generalmaster.find({ school: schoolId });
      if (redisClient.isReady) {
        // 3. Store result in Redis
        await redisClient.setEx(
          cacheKey,
          300,
          JSON.stringify(allGeneralmaster),
        );
      }

      res.status(200).json({
        success: true,
        source: "mongodb",
        message: "Success in fetching all  Generalmaster",
        data: allGeneralmaster,
      });
    } catch (error) {
      console.log("Error in getAllGeneralmaster", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Generalmaster. Try later",
      });
    }
  },
  getGeneralmasterWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      filterQuery["school"] = schoolId;
      if (req.query.search) {
        filterQuery.$or = [
          { generalmaster_name: { $regex: req.query.search, $options: "i" } },
          { generalmaster_type: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.query.hasOwnProperty("generalmaster_type")) {
        filterQuery["generalmaster_type"] = req.query.generalmaster_type;
      }

      const cacheKey = `generalmasters:${schoolId}`;

      let cachedData = null;
      if (redisClient.isReady) {
        // 1. Check Redis
        cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log("Redis Cache HIT");
          return res.status(200).json({
            success: true,
            source: "redis",
            message: "Success in fetching all  Generalmaster",
            data: JSON.parse(cachedData),
          });
        }
      }

      const filteredGeneralmasters = await Generalmaster.find(filterQuery);

      if (redisClient.isReady) {
        console.log("Redis Cache MISS");
        // 3. Store result in Redis
        await redisClient.setEx(
          cacheKey,
          300,
          JSON.stringify(filteredGeneralmasters),
        );
      }

      res.status(200).json({
        success: true,
        source: "mongodb",
        data: filteredGeneralmasters,
      });
    } catch (error) {
      console.log("Error in fetching Parent with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Bloodgroup  with query.",
      });
    }
  },
  createGeneralmaster_Old: (req, res) => {
    const schoolId = req.user.schoolId;
    const newGeneralmaster = new Generalmaster({
      ...req.body,
      school: schoolId,
    });
    newGeneralmaster
      .save()
      .then((savedData) => {
        console.log("Date saved", savedData);

        res.status(200).json({
          success: true,
          data: savedData,
          message: "Generalmaster is Created Successfully.",
        });
      })
      .catch((e) => {
        console.log("ERRORO in Register", e);
        res.status(500).json({ success: false, message: e.message });
      });
  },
  createGeneralmaster: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const newGeneralmaster = new Generalmaster({
        ...req.body,
        school: schoolId,
      });

      const savedData = await newGeneralmaster.save();

      console.log("Data saved:", savedData);

      const cacheKey = `generalmasters:${schoolId}`;
      if (redisClient.isReady) {
        // Invalidate cache
        await redisClient.del(cacheKey);
      }

      return res.status(200).json({
        success: true,
        data: savedData,
        message: "Generalmaster is Created Successfully.",
      });
    } catch (e) {
      console.error("ERROR in createGeneralmaster:", e);

      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },
  getGeneralmasterWithId: async (req, res) => {
    const id = req.params.id;
    const schoolId = req.user.schoolId;
    Generalmaster.findOne({ _id: id, school: schoolId })
      .then((resp) => {
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(500).json({
            success: false,
            message: "Generalmaster data not Available",
          });
        }
      })
      .catch((e) => {
        console.log("Error in getGeneralmasterWithId", e);
        res.status(500).json({
          success: false,
          message: "Error in getting  Generalmaster Data",
        });
      });
  },

  updateGeneralmasterWithId: async (req, res) => {
    // Not providing the  schoolId as generalmaster Id will be unique.
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;
      console.log(req.body);
      await Generalmaster.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
      );

      const cacheKey = `generalmasters:${schoolId}`;
      if (redisClient.isReady) {
        // Invalidate cache
        await redisClient.del(cacheKey);
      }

      const GeneralmasterAfterUpdate = await Generalmaster.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Generalmaster Updated",
        data: GeneralmasterAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateGeneralmasterWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Generalmaster. Try later",
      });
    }
  },
  deleteGeneralmasterWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;

      await Generalmaster.findOneAndDelete({ _id: id, school: schoolId });
      const GeneralmasterAfterDelete = await Generalmaster.findOne({ _id: id });

      const cacheKey = `generalmasters:${schoolId}`;
      if (redisClient.isReady) {
        // Invalidate cache
        await redisClient.del(cacheKey);
      }
      res.status(200).json({
        success: true,
        message: "Generalmaster Deleted.",
        data: GeneralmasterAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateGeneralmasterWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Generalmaster. Try later",
      });
    }
  },
};
