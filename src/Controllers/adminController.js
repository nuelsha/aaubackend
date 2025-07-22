import { validationResult } from "express-validator";
import Partnership from "../Models/partnershipModel.js";

export const getAllPartnerships = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Remove campusId filter: both Admin and SuperAdmin see all partnerships
    const partnerships = await Partnership.find({});
    res.status(200).json(partnerships);
  } catch (error) {
    console.error("Error fetching all partnerships:", error.message, error.stack);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getAllPartnerships };