const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("./JwtService");
const { CONFIG_MESSAGE_ERRORS, CONFIG_PERMISSIONS, CONFIG_USER_TYPE } = require("../configs");
const EmailService = require("../services/EmailService");
const AnalyticsService = require("../services/AnalyticsService");
const dotenv = require("dotenv");
const { addToBlacklist, isAdminPermission } = require("../utils");
const CloudinaryService = require("./CloudinaryService");
dotenv.config();
const moment = require("moment/moment");

// Helper function: Convert user avatar publicId to URL
const convertUserAvatarUrl = (user) => {
  const userData = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userData.password;
  if (userData.avatar && !userData.avatar.startsWith('http') && !userData.avatar.startsWith('data:')) {
    userData.avatarUrl = CloudinaryService.getOptimizedUrl(userData.avatar, 400);
    userData.avatarThumbnail = CloudinaryService.getThumbnailUrl(userData.avatar, 100);
  } else if (userData.avatar && userData.avatar.startsWith('http')) {
    userData.avatarUrl = userData.avatar;
  }
  return userData;
};

const registerUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = newUser;
    try {
      const existedUser = await User.findOne({
        email: email,
      });
      if (existedUser !== null) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The email of user is existed",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }
      const hash = bcrypt.hashSync(password, 10);
      const createdUser = await User.create({
        email,
        password: hash,
        status: 1,
        userType: CONFIG_USER_TYPE.DEFAULT,
      });
      if (createdUser) {
        // Log registration activity
        AnalyticsService.logActivity({
          user: createdUser._id,
          activityType: "register",
          metadata: { email: createdUser.email },
        }).catch(err => console.error("[Auth] Error logging registration:", err));
        
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
          message: "Register user success",
          typeError: "",
          data: createdUser,
          statusMessage: "Success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password, deviceToken } = userLogin;
    try {
      console.log("[LOGIN DEBUG] Attempting login for email:", email);
      
      const checkUser = await User.findOne({
        email: email,
        userType: CONFIG_USER_TYPE.DEFAULT,
      }).populate({
        path: "role",
        select: "name permissions",
      });

      console.log("[LOGIN DEBUG] User found:", checkUser ? "Yes" : "No");
      if (checkUser) {
        console.log("[LOGIN DEBUG] User details:", {
          id: checkUser._id,
          email: checkUser.email,
          hasPassword: !!checkUser.password,
          role: checkUser.role,
          userType: checkUser.userType
        });
      }

      if (checkUser === null) {
        console.log("[LOGIN DEBUG] User not found in database");
        return resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The username or password is wrong",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }
      
      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      console.log("[LOGIN DEBUG] Password match:", comparePassword);

      if (!comparePassword) {
        console.log("[LOGIN DEBUG] Password does not match");
        return resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The username or password is wrong",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }

      if (deviceToken && !checkUser?.deviceTokens?.includes(deviceToken)) {
        checkUser?.deviceTokens?.push(deviceToken);
        await checkUser.save();
      }

      const access_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRE
      );

      const refresh_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRE
      );

      console.log("[LOGIN DEBUG] Login successful for user:", checkUser.email);
      
      // Log login activity
      AnalyticsService.logActivity({
        user: checkUser._id,
        activityType: "login",
        metadata: { email: checkUser.email },
      }).catch(err => console.error("[Auth] Error logging login:", err));
      
      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Login Success",
        typeError: "",
        statusMessage: "Success",
        data: convertUserAvatarUrl(checkUser),
        access_token,
        refresh_token,
      });
    } catch (e) {
      console.log("[LOGIN DEBUG] Error occurred:", e.message);
      console.log("[LOGIN DEBUG] Error stack:", e.stack);
      reject(e);
    }
  });
};

const logoutUser = (res, accessToken) => {
  return new Promise(async (resolve, reject) => {
    try {
      // addToBlacklist(accessToken);
      res.clearCookie("refresh_token");
      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "logout Success",
        typeError: "",
        statusMessage: "Success",
        data: null,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateAuthMe = (id, data, isPermission) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (!checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The user is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      if (data.email && data.email !== checkUser.email) {
        const existedName = await User.findOne({
          email: data.email,
          _id: { $ne: id },
        });

        if (existedName !== null) {
          resolve({
            status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
            message: "The email of user is existed",
            typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
            data: null,
            statusMessage: "Error",
          });
          return;
        }
      }
      if (
        isAdminPermission(checkUser.permissions) &&
        (data.status !== checkUser.status || data.email !== checkUser.email)
      ) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.UNAUTHORIZED.status,
          message: "You can't change admin's email or status",
          typeError: CONFIG_MESSAGE_ERRORS.UNAUTHORIZED.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      if (data.addresses) {
        const defaultAddresses = data.addresses.filter((address) => address.isDefault);
        if (defaultAddresses.length > 1) {
          resolve({
            status: CONFIG_MESSAGE_ERRORS.INVALID.status,
            message: "Only one default address is allowed",
            typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
            data: null,
            statusMessage: "Error",
          });
          return;
        }
      }

      if (data.city) {
        checkUser.city = data.city;
      }

      if (data.role) {
        checkUser.role = data.role;
      }

      // Upload avatar mới lên Cloudinary nếu là base64
      let avatarPublicId = data.avatar;
      if (data.avatar && data.avatar.startsWith('data:image/')) {
        try {
          const result = await CloudinaryService.uploadBase64(data.avatar, 'avatars');
          avatarPublicId = result.publicId;
          console.log('✓ Uploaded new avatar to Cloudinary:', avatarPublicId);

          // Xóa avatar cũ từ Cloudinary
          if (checkUser.avatar && !checkUser.avatar.startsWith('data:image/') && !checkUser.avatar.startsWith('http')) {
            await CloudinaryService.deleteFile(checkUser.avatar);
            console.log('✓ Deleted old avatar from Cloudinary:', checkUser.avatar);
          }
        } catch (uploadError) {
          console.error('✗ Failed to upload avatar to Cloudinary:', uploadError);
          resolve({
            status: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status,
            message: "Failed to upload avatar",
            typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
            data: null,
            statusMessage: "Error",
          });
          return;
        }
      }

      checkUser.firstName = data.firstName;
      checkUser.lastName = data.lastName;
      checkUser.middleName = data.middleName;
      checkUser.email = data.email || checkUser.email;
      checkUser.phoneNumber = data.phoneNumber;
      checkUser.avatar = avatarPublicId;
      checkUser.address = data.address;
      checkUser.addresses = data.addresses || checkUser.addresses;
      await checkUser.save();

      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Updated user success",
        typeError: "",
        data: convertUserAvatarUrl(checkUser),
        statusMessage: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateDeviceToken = (id, data, isPermission) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { deviceToken } = data;
      const checkUser = await User.findOne({
        _id: id,
      });

      if (!checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The user is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      if (deviceToken && !checkUser?.deviceTokens?.includes(deviceToken)) {
        checkUser?.deviceTokens?.push(deviceToken);
        await checkUser.save();
      }
      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Updated user success",
        typeError: "",
        data: checkUser,
        statusMessage: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const changePasswordMe = (userId, data, res, accessToken) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: userId,
      });
      const { newPassword, currentPassword } = data;
      const comparePassword = bcrypt.compareSync(newPassword, checkUser.password);
      const compareCurrentPassword = bcrypt.compareSync(currentPassword, checkUser.password);

      if (checkUser === null) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The user is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }
      if (!compareCurrentPassword) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The  currentPassword is wrong",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }

      if (comparePassword) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The new password isn't not duplicate current password",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }
      const hash = bcrypt.hashSync(newPassword, 10);

      checkUser.password = hash;
      await checkUser.save();
      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "ChangePassword user success",
        typeError: "",
        data: null,
        statusMessage: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const forgotPasswordMe = (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        email,
        userType: CONFIG_USER_TYPE.DEFAULT,
      }).select("-password");

      if (checkUser === null) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The email is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const addedTime = moment().add(process.env.TIME_EXPIRE_PASSWORD, "seconds");

      checkUser.resetToken = resetToken;
      checkUser.resetTokenExpiration = addedTime.format("YYYY-MM-DDTHH:mm:ss.SSSZ"); // Hết hạn sau 1 giờ

      const resetLink = `${process.env.URL_RESET_PASSWORD}?secretKey=${resetToken}`;
      await checkUser.save();
      await EmailService.sendEmailForgotPassword(email, resetLink, process.env.TIME_EXPIRE_PASSWORD);
      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Forgot password success",
        typeError: "",
        data: checkUser,
        statusMessage: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const resetPasswordMe = (secretKey, newPassword) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        resetToken: secretKey,
        resetTokenExpiration: { $gt: Date.now() },
      });

      if (!user) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Invalid or expired token",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      const comparePassword = bcrypt.compareSync(newPassword, user.password);

      if (comparePassword) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The new password isn't not duplicate current password",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }

      const hash = bcrypt.hashSync(newPassword, 10);

      user.password = hash;
      user.resetToken = null;
      user.resetTokenExpiration = null;
      await user.save();

      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Password reset successfully",
        typeError: "",
        data: user,
        statusMessage: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const verifyGoogleIdToken = async (idToken) => {
  try {
    // const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    // const client = new OAuth2Client(CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken,
    //   audience: CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    // return payload;

    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await response.json();

    return data;
  } catch (error) {
    return null;
  }
};

const verifyFacebookIdToken = async (idToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${idToken}&fields=picture,email,first_name,last_name`,
      {
        method: "GET",
      }
    );
    const data = await response.json();

    return data;
  } catch (error) {
    return null;
  }
};

const registerGoogle = (idToken) => {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await verifyGoogleIdToken(idToken);
      if (!payload) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Validate user is error",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }

      const { email, family_name, given_name, picture } = payload;

      let checkUser = await User.findOne({ email: email });
      if (checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The user is existed",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }
      const newUser = await User.create({
        email,
        firstName: given_name,
        avatar: picture,
        lastName: family_name,
        userType: CONFIG_USER_TYPE.GOOGLE,
      });
      if (newUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
          message: "Register user success",
          typeError: "",
          data: newUser,
          statusMessage: "Success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const loginGoogle = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { idToken, deviceToken = "" } = data;
      const payload = await verifyGoogleIdToken(idToken);
      if (!payload) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Validate user is error",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }
      const { email } = payload;

      const checkUser = await User.findOne({
        email: email,
        userType: CONFIG_USER_TYPE.GOOGLE,
      }).populate({
        path: "role",
        select: "name permissions",
      });

      if (!checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The user is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      if (deviceToken && !checkUser.deviceTokens.includes(deviceToken)) {
        checkUser.deviceTokens.push(deviceToken);
        await checkUser.save();
      }

      const access_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRE
      );

      const refresh_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRE
      );

      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Login Success",
        typeError: "",
        statusMessage: "Success",
        data: convertUserAvatarUrl(checkUser),
        access_token,
        refresh_token,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const registerFacebook = (idToken) => {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await verifyFacebookIdToken(idToken);
      if (!payload) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Validate user is error",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }
      const { email, first_name, last_name, picture } = payload;
      const avatar = picture?.data?.url;

      let checkUser = await User.findOne({ email: email });
      if (checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.status,
          message: "The user is existed",
          typeError: CONFIG_MESSAGE_ERRORS.ALREADY_EXIST.type,
          data: null,
          statusMessage: "Error",
        });
      }
      const newUser = await User.create({
        email,
        firstName: first_name,
        avatar,
        lastName: last_name,
        userType: CONFIG_USER_TYPE.FACEBOOK,
      });
      if (newUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
          message: "Register user success",
          typeError: "",
          data: newUser,
          statusMessage: "Success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const loginFacebook = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { idToken, deviceToken = "" } = data;

      const payload = await verifyFacebookIdToken(idToken);
      if (!payload) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "Validate user is error",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
      }

      const { email } = payload;

      let checkUser = await User.findOne({
        email: email,
        userType: CONFIG_USER_TYPE.FACEBOOK,
      }).populate({
        path: "role",
        select: "name permissions",
      });

      if (!checkUser) {
        resolve({
          status: CONFIG_MESSAGE_ERRORS.INVALID.status,
          message: "The user is not existed",
          typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
          data: null,
          statusMessage: "Error",
        });
        return;
      }

      if (deviceToken && !checkUser.deviceTokens.includes(deviceToken)) {
        checkUser.deviceTokens.push(deviceToken);
        await checkUser.save();
      }

      const access_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRE
      );

      const refresh_token = await generateToken(
        {
          id: checkUser.id,
          permissions: checkUser?.role?.permissions,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRE
      );

      resolve({
        status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
        message: "Login Success",
        typeError: "",
        statusMessage: "Success",
        data: convertUserAvatarUrl(checkUser),
        access_token,
        refresh_token,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  loginUser,
  logoutUser,
  updateAuthMe,
  changePasswordMe,
  forgotPasswordMe,
  resetPasswordMe,
  registerGoogle,
  registerFacebook,
  loginFacebook,
  loginGoogle,
  registerUser,
  updateDeviceToken,
};
