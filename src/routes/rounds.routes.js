const express = require("express");
const roundsController = require("../controllers/rounds.controller");
const {
  authenticateJWT,
  authorizeAdmin,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/tournaments/:tournamentId/rounds",
  authenticateJWT,
  authorizeAdmin,
  roundsController.createRound,
);
router.patch(
  "/rounds/:id",
  authenticateJWT,
  authorizeAdmin,
  roundsController.updateRound,
);
router.delete(
  "/rounds/:id",
  authenticateJWT,
  authorizeAdmin,
  roundsController.deleteRound,
);
router.patch(
  "/rounds/:id/matches/:matchId",
  authenticateJWT,
  authorizeAdmin,
  roundsController.assignMatchToRound,
);
router.get("/tournaments/:id/bracket", roundsController.getTournamentBracket);

module.exports = router;
