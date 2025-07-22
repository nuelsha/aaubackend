import { validationResult } from "express-validator";
import User from "../Models/userModel.js";

export const getUsers = async (req, res) => {
      try {
         const errors = validationResult(req);
         if (!errors.isEmpty()) {
           return res.status(400).json({ errors: errors.array() });
         }

         const query = req.user.role === "SuperAdmin"
           ? {}
           : { campusId: req.user.campusId };
         const users = await User.find(query).select("-password");

         res.status(200).json(users);
       } catch (error) {
         console.error("Error fetching users:", error.message, error.stack);
         res.status(500).json({ error: "Server error" });
       }
     };

export default { getUsers };