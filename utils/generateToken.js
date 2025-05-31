const jwt = require("jsonwebtoken");

const generateToken = (payload, expiresIn) => {
  console.log(" before");
  console.log(
    "temptoken: ",
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })
  );
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};
module.exports = generateToken;
