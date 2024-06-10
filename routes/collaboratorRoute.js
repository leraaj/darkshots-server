const express = require("express");
const router = express.Router();
const {
  getCollaborators,
  getCollaborator,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
} = require("../controllers/collaboratorController");

router.get("/collaborators", getCollaborators);
router.post("/collaborator", addCollaborator);
router.delete("/collaborator/:id", deleteCollaborator);
router.get("/collaborator/:id", getCollaborator);
router.put("/collaborator/:id", updateCollaborator);
// router.use(requireAuth);

module.exports = router;
