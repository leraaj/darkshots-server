const fs = require("fs");

const { GoogleAuth } = require("google-auth-library");

const keyFile = fs.existsSync(process.env.RENDER_GOOGLE_API_KEY)
  ? process.env.RENDER_GOOGLE_API_KEY
  : process.env.LOCAL_GOOGLE_API_KEY;

const auth = new GoogleAuth({
  scopes: process.env.GOOGLE_SCOPES,
  keyFile: keyFile,
  subject: process.env.COMPANY_EMAIL,
});
module.exports = { auth };
