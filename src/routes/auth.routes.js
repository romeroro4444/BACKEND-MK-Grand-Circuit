const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticateJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/register-admin", authController.registerAdmin);
router.post("/login", authController.login);
router.get("/profile", authenticateJWT, authController.getProfile);
router.get("/profile/:id", authController.getProfileById);
router.put("/profile-edit", authenticateJWT, authController.updateProfile);

module.exports = router;
