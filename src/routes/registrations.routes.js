const express = require("express");
const registrationsController = require("../controllers/registrations.controller");
const {
  authenticateJWT,
  authorizeAdmin,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/tournaments/:id/register",
  authenticateJWT,
  registrationsController.registerTeam,
);
router.get(
  "/tournaments/:id/registrations",
  registrationsController.getTournamentRegistrations,
);
router.patch(
  "/registrations/:id/approve",
  authenticateJWT,
  authorizeAdmin,
  registrationsController.approveRegistration,
);
router.patch(
  "/registrations/:id/reject",
  authenticateJWT,
  authorizeAdmin,
  registrationsController.rejectRegistration,
);

module.exports = router;
