import jwt from "jsonwebtoken";

       const generateTokenAndSetCookie = (user, res) => {
         try {
           const token = jwt.sign(
             { id: user._id, role: user.role, campusId: user.campusId },
             process.env.PRIVATE_KEY,
             { expiresIn: "1d" }
           );
           res.cookie("jwt", token, {
             httpOnly: true,
             secure: false, // Allow cookies over http in development must be reverted DONT FORGETTTT
             sameSite: "strict",
             maxAge: 24 * 60 * 60 * 1000,
           });

    return token;
  } catch (error) {
    console.error("Error generating token:", error.message, error.stack);
    throw error;
  }
};

export default generateTokenAndSetCookie;
