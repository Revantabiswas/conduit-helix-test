const express = require("express");
const { version } = require("../package.json");

const router = express.Router();

// Public service metadata. The version is read once, at module load.
router.get("/", (req, res) => {
  res.json({ name: "conduit", version });
});

module.exports = router;
