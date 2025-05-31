const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const verifyToken = require("../middlewares/verifyToken");

// User Registration & Activation
router.post("/register", authController.register);
router.get("/resend-activation", authController.resendActivation);
router.get("/activate/:token", authController.activate);

router.post("/login", authController.login);
router.get("/logout", authController.logout);

//verifying protected routes
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user }); // `req.user` will be populated by middleware
});

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

router.post("/set-password", verifyToken, authController.setPassword);

module.exports = router;
