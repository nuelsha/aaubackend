import { validationResult } from "express-validator";
import Partnership from "../Models/partnershipModel.js";
import mongoose from "mongoose";
import { sendNotification } from "../Utils/sendNotification.js";

export const getAllPartnerships = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admins and SuperAdmins see all partnerships
    const partnerships = await Partnership.find({});
    res.status(200).json(partnerships);
  } catch (error) {
    console.error("Error in getAllPartnerships:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const createPartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.status !== "active") {
      return res.status(403).json({
        error: `User account not active. Current status: ${req.user.status}`,
      });
    }

    const {
      partnerInstitution,
      aauContact,
      potentialAreasOfCollaboration,
      otherCollaborationArea,
      potentialStartDate,
      durationOfPartnership,
      partnerContactPerson,
      partnerContactPersonSecondary,
      aauContactPerson,
      aauContactPersonSecondary,
      description,
      mouFileUrl,
      status,
      deliverables,
      fundingAmount,
      reportingRequirements,
      scope,
    } = req.body;

    if (
      Array.isArray(potentialAreasOfCollaboration) &&
      potentialAreasOfCollaboration.includes("Other") &&
      !otherCollaborationArea
    ) {
      return res.status(400).json({
        error: "Other collaboration area is required when 'Other' is selected",
      });
    }

    // Validate status if provided
    if (status && !["Active", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: Active, Rejected, or Pending",
      });
    }

    const partnership = new Partnership({
      partnerInstitution,
      aauContact,
      potentialAreasOfCollaboration,
      otherCollaborationArea,
      potentialStartDate: new Date(potentialStartDate),
      durationOfPartnership,
      partnerContactPerson,
      partnerContactPersonSecondary,
      aauContactPerson,
      aauContactPersonSecondary,
      status: status,
      campusId:
        req.user.role === "SuperAdmin" ? "default_campus" : req.user.campusId,
      createdBy: req.user.userId,
      isArchived: false,
      description,
      mouFileUrl,
      deliverables,
      fundingAmount,
      reportingRequirements,
      scope,
    });

    await partnership.save();
    // Event-based notification: New Partnership Request
    await sendNotification({
      title: "New Partnership Request",
      message: `${partnership.partnerInstitution.name} has requested a new partnership`,
      type: "Partnerships",
    });

    res.status(201).json({
      message: "Partnership created successfully",
      partnership,
    });
  } catch (error) {
    console.error("Error creating partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPartnerships = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      typeOfOrganization,
      potentialStartDate,
      durationOfPartnership,
      archived,
      limit = 10,
      page = 1,
      sortBy = 'createdAt',
      sortDirection = 'asc',
      types = [],
      statuses = [],
      durations = [],
    } = req.query;
    // Admins and SuperAdmins see all partnerships
    let filter = {};

    // Support array or string for types/statuses/durations
    const typesArr = Array.isArray(types) ? types : types ? [types] : [];
    const statusesArr = Array.isArray(statuses) ? statuses : statuses ? [statuses] : [];
    const durationsArr = Array.isArray(durations) ? durations : durations ? [durations] : [];

    if (status) filter.status = status;
    if (typeOfOrganization)
      filter["partnerInstitution.typeOfOrganization"] = typeOfOrganization;
    if (durationOfPartnership)
      filter.durationOfPartnership = durationOfPartnership;
    if (typesArr.length > 0) filter["partnerInstitution.typeOfOrganization"] = { $in: typesArr };
    if (statusesArr.length > 0) filter.status = { $in: statusesArr };
    if (durationsArr.length > 0) filter.durationOfPartnership = { $in: durationsArr };

    if (potentialStartDate) {
      if (!isValidDate(potentialStartDate)) {
        return res
          .status(400)
          .json({ error: "Invalid potential start date format" });
      }
      filter.potentialStartDate = { $gte: new Date(potentialStartDate) };
    }

    filter.isArchived = archived === "true" ? true : false;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    if (parsedLimit < 1 || parsedPage < 1) {
      return res
        .status(400)
        .json({ error: "Limit and page must be positive integers" });
    }
    if (parsedLimit > 100) {
      return res.status(400).json({ error: "Limit cannot exceed 100" });
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Partnership.countDocuments(filter);
    // Build sort object
    const sortObj = {};
    if (sortBy) {
      sortObj[sortBy] = sortDirection === 'desc' ? -1 : 1;
    }
    const partnerships = await Partnership.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      partnerships,
      pagination: {
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching partnerships:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPartnershipById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admins and SuperAdmins can access any partnership
    const filter = { _id: req.params.id };
    const partnership = await Partnership.findOne(filter);

    if (!partnership) {
      return res
        .status(404)
        .json({ message: "Partnership not found" });
    }
    res.status(200).json(partnership);
  } catch (error) {
    console.error("Error fetching partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

// partnershipController.js
export const updatePartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Restrict Admins to only update partnerships they created
    let filter = { _id: req.params.id };
    if (req.user.role === "Admin") {
      filter.createdBy = req.user.userId;
    }

    const updateData = { ...req.body };
    console.log('Incoming updatePartnership payload:', JSON.stringify(updateData, null, 2));
    if (
      Array.isArray(updateData.potentialAreasOfCollaboration) &&
      updateData.potentialAreasOfCollaboration.includes("Other") &&
      !updateData.otherCollaborationArea
    ) {
      return res.status(400).json({
        error: "Other collaboration area is required when 'Other' is selected",
      });
    }

    // Additional validation for partnerInstitution
    if (updateData.partnerInstitution) {
      if (!updateData.partnerInstitution.name) {
        return res
          .status(400)
          .json({ error: "Partner institution name is required" });
      }
      if (!updateData.partnerInstitution.address) {
        return res
          .status(400)
          .json({ error: "Partner institution address is required" });
      }
      if (!updateData.partnerInstitution.country) {
        return res
          .status(400)
          .json({ error: "Partner institution country is required" });
      }
      if (!updateData.partnerInstitution.typeOfOrganization) {
        return res.status(400).json({
          error: "Partner institution type of organization is required",
        });
      }
    }

    const updatedPartnership = await Partnership.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPartnership) {
      // If admin, show access error; otherwise, not found
      if (req.user.role === "Admin") {
        return res.status(403).json({ message: "You do not have access to modify this partnership." });
      } else {
        return res.status(404).json({ message: "Partnership not found" });
      }
    }
    // Event-based notification: Partnership Updated
    await sendNotification({
      title: "Partnership Updated",
      message: `Partnership ${updatedPartnership.partnerInstitution?.name || ""} has been updated`,
      type: "Partnerships",
    });

    res.status(200).json({
      message: "Partnership updated successfully",
      partnership: updatedPartnership,
    });
  } catch (error) {
    console.error("Error updating partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const deletePartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Restrict Admins to only delete partnerships they created
    let filter = { _id: req.params.id };
    if (req.user.role === "Admin") {
      filter.createdBy = req.user.userId;
    }
    const deletedPartnership = await Partnership.findOneAndDelete(filter);

    if (!deletedPartnership) {
      // If admin, show access error; otherwise, not found
      if (req.user.role === "Admin") {
        return res.status(403).json({ message: "You do not have access to delete this partnership." });
      } else {
        return res.status(404).json({ message: "Partnership not found" });
      }
    }

    res.status(200).json({ message: "Partnership deleted successfully" });
  } catch (error) {
    console.error("Error deleting partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const renewPartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admins and SuperAdmins can renew any partnership
    const filter = { _id: req.params.id };
    const partnership = await Partnership.findOne(filter);

    if (!partnership) {
      return res
        .status(404)
        .json({ message: "Partnership not found" });
    }

    partnership.potentialStartDate = new Date(req.body.potentialStartDate);
    partnership.durationOfPartnership = req.body.durationOfPartnership;
    await partnership.save();

    res.status(200).json({
      message: "Partnership renewed successfully",
      updatedPartnership: partnership,
    });
  } catch (error) {
    console.error("Error renewing partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const exportPartnerships = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admins and SuperAdmins can export all partnerships
    const partnerships = await Partnership.find({});

    res.status(200).json(partnerships);
  } catch (error) {
    console.error("Error exporting partnerships:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const approvePartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid partnership ID" });
    }

    if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only Admins or SuperAdmins can approve partnerships" });
    }

    // Admins and SuperAdmins can approve any partnership
    const filter = { _id: id };
    const partnership = await Partnership.findOne(filter);
    if (!partnership) {
      return res
        .status(404)
        .json({ error: "Partnership not found" });
    }

    if (partnership.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "Only pending partnerships can be approved" });
    }

    partnership.status = "Active";
    await partnership.save();

    res.status(200).json({
      message: "Partnership approved successfully",
      partnership,
    });
  } catch (error) {
    console.error("Error approving partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const rejectPartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid partnership ID" });
    }

    if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only Admins or SuperAdmins can reject partnerships" });
    }

    // Admins and SuperAdmins can reject any partnership
    const filter = { _id: id };
    const partnership = await Partnership.findOne(filter);
    if (!partnership) {
      return res
        .status(404)
        .json({ error: "Partnership not found" });
    }

    if (partnership.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "Only pending partnerships can be rejected" });
    }

    partnership.status = "Rejected";
    await partnership.save();

    res.status(200).json({
      message: "Partnership rejected successfully",
      partnership,
    });
  } catch (error) {
    console.error("Error rejecting partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export const archivePartnership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid partnership ID" });
    }

    // Admins and SuperAdmins can archive any partnership
    const filter = { _id: id };
    const partnership = await Partnership.findOne(filter);
    if (!partnership) {
      return res
        .status(404)
        .json({ error: "Partnership not found" });
    }

    if (partnership.isArchived) {
      return res.status(400).json({ error: "Partnership is already archived" });
    }

    partnership.isArchived = true;
    await partnership.save();

    res.status(200).json({
      message: "Partnership archived successfully",
      partnership,
    });
  } catch (error) {
    console.error("Error archiving partnership:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

function isValidDate(dateString) {
  return !isNaN(Date.parse(dateString));
}

export default {
  getAllPartnerships,
  createPartnership,
  getPartnerships,
  getPartnershipById,
  updatePartnership,
  deletePartnership,
  renewPartnership,
  exportPartnerships,
  approvePartnership,
  rejectPartnership,
  archivePartnership,
};