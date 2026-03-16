const express = require("express");
const tournamentsController = require("../controllers/tournaments.controller");
const {
  authenticateJWT,
  authorizeAdmin,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticateJWT,
  authorizeAdmin,
  tournamentsController.createTournament,
);
router.get("/", tournamentsController.getAllTournaments);
router.get("/:id/public", tournamentsController.getPublicTournamentView);
router.get("/:id", tournamentsController.getTournamentById);
router.patch(
  "/:id",
  authenticateJWT,
  authorizeAdmin,
  tournamentsController.updateTournament,
);
router.patch(
  "/:id/status",
  authenticateJWT,
  authorizeAdmin,
  tournamentsController.updateTournamentStatus,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeAdmin,
  tournamentsController.deleteTournament,
);

module.exports = router;
