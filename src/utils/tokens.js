const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateApiKey() {
  return `fn_${crypto.randomBytes(32).toString("hex")}`;
}

function generateJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

module.exports = {
  generateApiKey,
  generateJwt,
};