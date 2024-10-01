const express = require("express");
const router = express.Router();
const {
  getCollaborators,
  getCollaborator,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
  deleteAllCollaborators,
} = require("../controllers/collaboratorController");

router.get("/collaborators/:id", getCollaborators);
router.post("/collaborator", addCollaborator);
router.get("/collaborator/:id", getCollaborator);
router.put("/collaborator/:id", updateCollaborator);
router.delete("/collaborator/:id", deleteCollaborator);
router.delete("/collaborators", deleteAllCollaborators);
// router.use(requireAuth);

module.exports = router;
