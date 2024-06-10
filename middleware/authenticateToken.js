const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.cookies.Auth_Token;
  console.log(token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    console.error(err);
    if (err) return res.status(403).json({ message: "Forbidden" });
    next();
  });
};

module.exports = authenticateToken;
