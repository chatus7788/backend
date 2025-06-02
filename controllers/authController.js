const User = require("../models/User");
const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");
const passport = require("passport");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_REMEMBER_ME_EXPIRES_IN = process.env.JWT_REMEMBER_ME_EXPIRES_IN;

const register = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    // console.log("password 2:", password);
    const user = await authService.registerUser(email, phone, password);

    res.status(201).json({
      msg: "Registration successful, please activate your email. ",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

const activate = async (req, res) => {
  try {
    const { token } = req.params;
    await authService.activateUser(token);
    res.status(200).json({ msg: "Account activated, you can login now" });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

const resendActivation = async (req, res) => {
  try {
    const { id } = req.query; // get user ID from frontend like ?id=6836...

    if (!id) throw new Error("User ID is required");

    await authService.resendActivationEmailById(id);

    res.status(200).json({ msg: "Activation email resent successfully." });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberme } = req.body;

    console.log("object");
    console.log(email);
    console.log(password);
    console.log(rememberme);

    const user = await authService.loginUser(email, password);

    const expiresIn = rememberme ? JWT_REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;

    const token = generateToken({ id: user._id, email: user.email }, expiresIn);
    console.log("login token: ", token);
    res.cookie("userToken", token, {
      httpOnly: true,
      // secure: false,
      // sameSite: "lax", //None
      secure: true, // ✅ must be true for HTTPS + cross-site
      sameSite: "None", // ✅ required for cross-origin cookie
      maxAge: rememberme ? 24 * 60 * 60 * 1000 * 7 : undefined,
    });

    res.json({ msg: "logged in successfully" });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

const logout = async (req, res) => {
  // res.clearCookie("userToken");
  res.clearCookie("userToken", {
    httpOnly: true,
    // secure: false,
    // sameSite: "lax",
    secure: true, // ✅ must be true for HTTPS + cross-site
    sameSite: "None", // ✅ required for cross-origin cookie
  });
  res.json({ msg: "logout successfull" });
};

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  prompt: "consent", //we can remove this added later on for
});

// const googleAuth = async (req, res, next) => {
//   try {
//     const emailHint = req.query.email;
//     console.log("emailHint: ", emailHint);
//     let promptOption = {};

//     if (emailHint) {
//       const user = await User.findOne({ email: emailHint });
//       if (!user) {
//         promptOption.prompt = "consent";
//       }
//     }

//     passport.authenticate("google", {
//       scope: ["profile", "email"],
//       ...promptOption,
//     })(req, res, next);
//   } catch (err) {
//     console.error("Google OAuth error:", err);
//     res.redirect(`${process.env.FRONTEND_URL}/login`);
//   }
// };

const googleCallback = (req, res, next) => {
  console.log("hitttt");
  passport.authenticate(
    "google",
    { failureRedirect: `${process.env.FRONTEND_URL}/login` },
    (err, user) => {
      console.log("User returned from Google:", user);

      if (err || !user) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=oauth_failed`
        );
      }
      //added later to stop going back, we can can remove this condition
      // if (req.cookies.userToken) {
      //   return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
      // }

      // If password is not set, redirect to set-password
      if (!user.password) {
        const token = generateToken(
          { id: user._id, email: user.email },
          process.env.JWT_REMEMBER_ME_EXPIRES_IN
        );

        res.cookie("userToken", token, {
          httpOnly: true,
          // secure: false,
          // sameSite: "lax",
          secure: true, // ✅ must be true for HTTPS + cross-site
          sameSite: "None", // ✅ required for cross-origin cookie
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(`${process.env.FRONTEND_URL}/set-password`);
      }

      // generate JWT
      const token = generateToken(
        { id: user._id, email: user.email },
        process.env.JWT_REMEMBER_ME_EXPIRES_IN
      );

      res.cookie("userToken", token, {
        httpOnly: true,
        // secure: false,
        // sameSite: "lax",
        secure: true, // ✅ must be true for HTTPS + cross-site
        sameSite: "None", // ✅ required for cross-origin cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days remember me default for OAuth
      });

      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
  )(req, res, next);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email:", email);
    const user = await authService.forgotPasswordUser(email);
    res.status(200).json({ msg: "Reset link sent to your mail" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await authService.resetPasswordUser(token, password);
    // res.clearCookie("userToken");
    res.clearCookie("userToken", {
      httpOnly: true,
      // sameSite: "lax",
      // secure: false,
      secure: true, // ✅ must be true for HTTPS + cross-site
      sameSite: "None", // ✅ required for cross-origin cookie
    });
    res.status(200).json({ msg: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const response = await authService.setPasswordUser(userId, password);
    return res.status(response.status).json({ message: response.message });
  } catch (err) {
    console.error("Error in setPassword controller:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  activate,
  login,
  logout,
  googleAuth,
  googleCallback,
  resendActivation,
  forgotPassword,
  resetPassword,
  setPassword,
};
