// test-password.js
import bcrypt from "bcryptjs";

const storedHash = "$2b$12$T.Srkfj3tGR59U6GJ2qKoOHukSyx29JKggbMVhsqflxOvP0z6n6HW";
const inputPassword = "NewPass1234";

bcrypt.compare(inputPassword, storedHash).then(result => {
  console.log("Password match:", result);
});