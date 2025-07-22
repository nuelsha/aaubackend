import express from "express";
import { check, body } from "express-validator";
import auth from "../Middlewares/auth.js";
import partnershipController from "../Controllers/partnershipController.js";

const router = express.Router();

// POST /api/partnership
// Expects multipart/form-data with optional file field 'mouFile'
router.post(
  "/",
  auth.authenticateToken,
  auth.authorizeRoles("User", "Admin", "SuperAdmin"),
  [
    // Partner Institution validation
    check("partnerInstitution.name")
      .notEmpty()
      .withMessage("Partner name is required"),
    check("partnerInstitution.address")
      .notEmpty()
      .withMessage("Partner address is required"),
    check("partnerInstitution.country")
      .notEmpty()
      .withMessage("Partner country is required"),
    check("partnerInstitution.typeOfOrganization")
      .notEmpty()
      .withMessage("Organization type is required"),

    // AAU Contact validation
    check("aauContact.interestedCollegeOrDepartment")
      .notEmpty()
      .withMessage("AAU department is required"),

    // Contact Person validation
    check("partnerContactPerson.name")
      .notEmpty()
      .withMessage("Partner contact name is required"),
    check("partnerContactPerson.institutionalEmail")
      .isEmail()
      .withMessage("Valid partner email is required"),
    check("partnerContactPerson.phoneNumber")
      .notEmpty()
      .withMessage("Partner phone number is required"),

    // AAU Contact Person validation
    check("aauContactPerson.name")
      .notEmpty()
      .withMessage("AAU contact name is required"),
    check("aauContactPerson.institutionalEmail")
      .isEmail()
      .withMessage("Valid AAU email is required"),
    check("aauContactPerson.phoneNumber")
      .notEmpty()
      .withMessage("AAU phone number is required"),

    // Date validation
    check("potentialStartDate")
      .isISO8601()
      .withMessage("Valid start date is required"),
    check("durationOfPartnership")
      .notEmpty()
      .withMessage("Duration is required"),

    // Collaboration areas
    // check("potentialAreasOfCollaboration").isArray({ min: 1 }).withMessage("At least one collaboration area is required"),

    // Conditional validation for "Other" collaboration
    // body().custom((value, { req }) => {
    //   if (value.potentialAreasOfCollaboration.includes("Other") && !value.otherCollaborationArea) {
    //     throw new Error("Other collaboration description is required when 'Other' is selected");
    //   }
    //   return true;
    // })
  ],
  partnershipController.createPartnership
);

router.get(
  "/",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [
    check("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be an integer between 1 and 100"),
    check("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    check("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    check("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
    check("status")
      .optional()
      .isIn(["Pending", "Active", "Rejected"])
      .withMessage("Invalid status value"),
    check("archived")
      .optional()
      .isBoolean()
      .withMessage("Archived must be a boolean"),
  ],
  partnershipController.getPartnerships
);

router.get(
  "/export",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  partnershipController.exportPartnerships
);

router.get(
  "/:id",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.getPartnershipById
);

router.put(
  "/:id",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.updatePartnership
);

router.delete(
  "/:id",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.deletePartnership
);

router.patch(
  "/:id/renew",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [
    check("id").isMongoId().withMessage("Invalid partnership ID"),
    check("expiringDate")
      .isISO8601()
      .withMessage("Valid expiring date is required"),
    check("MOUFile").notEmpty().withMessage("MOU file is required"),
  ],
  partnershipController.renewPartnership
);

router.patch(
  "/:id/approve",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.approvePartnership
);

router.patch(
  "/:id/reject",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.rejectPartnership
);

router.patch(
  "/:id/archive",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid partnership ID")],
  partnershipController.archivePartnership
);

export default router;
