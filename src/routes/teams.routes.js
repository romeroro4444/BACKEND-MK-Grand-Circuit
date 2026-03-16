const express = require("express");
const teamsController = require("../controllers/teams.controller");
const { authenticateJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticateJWT, teamsController.createTeam);
router.get("/my-team", authenticateJWT, teamsController.getMyTeam);
router.get("/:id", teamsController.getTeamById);
router.get("/:id/history", teamsController.getTeamHistory);
router.patch("/:id", authenticateJWT, teamsController.updateTeam);
router.post(
  "/:id/upload-url",
  authenticateJWT,
  teamsController.createUploadUrl,
);
router.post("/:id/members", authenticateJWT, teamsController.addMember);
router.delete(
  "/:id/members/:userId",
  authenticateJWT,
  teamsController.removeMember,
);

module.exports = router;
