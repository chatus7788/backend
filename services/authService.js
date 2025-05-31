const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendMail = require("../config/sendGrid");

const SALT_ROUNDS = 10;

const generateActivationToken = () => crypto.randomBytes(20).toString("hex");

const registerUser = async (email, phone, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (!existingUser.isActivated) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const activationToken = generateActivationToken();

      existingUser.phone = phone;
      existingUser.password = hashedPassword;
      existingUser.activationToken = activationToken;

      await existingUser.save();

      const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
      const emailText = "Please activate your account";
      await sendMail(email, activationUrl, emailText);

      return existingUser;
      // return {
      //   message:
      //     "Account already exists but not activated. Info updated and activation link resent.",
      //   data: existingUser,
      // };
    }
  }

  // if (existingUser) {
  //   if (!existingUser.isActivated) {
  //     // Resend activation link
  //     existingUser.activationToken = generateActivationToken();
  //     await existingUser.save();

  //     const activationUrl = `${process.env.FRONTEND_URL}/activate/${existingUser.activationToken}`;
  //     const emailText = "please active your account";
  //     await sendMail(email, activationUrl, emailText);

  //     console.log("existingUser: ", existingUser);
  //     return existingUser;
  //   }

  //   throw new Error("email already registered");
  // }

  if (existingUser) throw new Error("email already registered Please login!");

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const activationToken = generateActivationToken();

  const user = new User({
    email,
    phone,
    password: hashedPassword,
    // activationToken: activationToken,
    activationToken,
    isActivated: false,
  });
  console.log("user:", user);
  await user.save();
  const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
  const emailText = "please active your account";
  await sendMail(email, activationUrl, emailText);
  console.log("user is: ", user);
  return user;
};

const activateUser = async (token) => {
  const user = await User.findOne({ activationToken: token });
  if (!user) throw new Error("Invalid Credentials");

  user.isActivated = true;
  user.activationToken = undefined;
  await user.save();
  return user;
};

const resendActivationEmailById = async (id) => {
  const user = await User.findById(id);

  if (!user) throw new Error("User not found");
  if (user.isActivated) throw new Error("Account is already activated");

  // Generate new activation token
  const newToken = generateActivationToken();
  user.activationToken = newToken;
  await user.save();
  const activationUrl = `${process.env.FRONTEND_URL}/activate/${newToken}`;
  const emailText = "Please active your account";
  await sendMail(user.email, activationUrl, emailText);
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid Credentials email");
  if (!user.isActivated) throw new Error("please activate your account");

  console.log("ismatch pre:", user.password ? "yes" : "no");

  if (user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("invalid password, you can reset");
  } else {
    throw new Error(
      "You need to set a password before logging in. Tap 'Forgot Password' to continue"
    );
  }
  // bcrypt.compare(password, passwordCheck);
  // if (!isMatch) throw new
  return user;
};

const forgotPasswordUser = async (email) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error("User not found");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save();

  console.log("resetToken: ", resetToken);
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const emailText = "please reset your password";
  await sendMail(user.email, resetLink, emailText);

  return user;
};

const resetPasswordUser = async (token, password) => {
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // const resetTokenHash =
  //   "247d2367ed8273204b0ceda36cd00e12a402c58287d5522de448ea84ca8bf01d";
  console.log("resetTokenHash: ", resetTokenHash);

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Invalid or expired token");
  // return res.status(400).json({ message: "Invalid or expired token" });
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  user.password = hashedPassword; // make sure to hash in model middleware
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return user;
  // res.status(200).json({ message: "Password reset successful" });
};

const setPasswordUser = async (userId, password) => {
  if (!password || password.length < 6) {
    return { status: 400, message: "Password too short" };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.password) {
    return { status: 400, message: "Password already set" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();

  return { status: 200, message: "Password set successfully" };
};

module.exports = {
  registerUser,
  activateUser,
  loginUser,
  resendActivationEmailById,
  forgotPasswordUser,
  resetPasswordUser,
  setPasswordUser,
};
