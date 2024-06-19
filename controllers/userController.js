const UserModel = require("../model/userModel");
const ApplicationModel = require("../model/applicationModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const checkForDuplicates = require("../middleware/checkForDuplicates");
const AppointmentModel = require("../model/appointmentModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const cookieExpires = 3 * 24 * 60 * 60 * 1000;
const createToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: cookieExpires,
  });
};

const getUsers = async (request, response) => {
  try {
    // Fetch all users
    const users = await UserModel.find({});

    // Array to hold promises for counting applications with status 1 for each user
    const promises = users.map(async (user) => {
      // Count applications where user matches and applicationStatus is 1
      const applicationStatus1 = await ApplicationModel.countDocuments({
        user: user._id, // Match applications for this user
        applicationStatus: 1, // Count applications with applicationStatus 1
      });
      const applicationStatus2AndNoDisable =
        await ApplicationModel.countDocuments({
          user: user._id, // Match applications for this user
          applicationStatus: 2, // Count applications with applicationStatus 1
          disabled: false,
        });
      const applicationTasks =
        applicationStatus1 + applicationStatus2AndNoDisable;

      const initialScreening = await AppointmentModel.countDocuments({
        user: user._id, // Match applications for this user
        phase: 1,
        appointmentStatus: 2,
      });
      const finalInterview = await AppointmentModel.countDocuments({
        user: user._id, // Match applications for this user
        phase: 2,
        appointmentStatus: 2,
      });
      const teamIntroduction = await AppointmentModel.countDocuments({
        user: user._id, // Match applications for this user
        phase: 2,
        appointmentStatus: 2,
      });
      const appointmentTasks =
        initialScreening + finalInterview + teamIntroduction;
      return {
        ...user.toObject(), // Convert Mongoose document to plain object
        applicationTasks: applicationTasks,
        appointmentTasks: appointmentTasks,
      };
    });

    // Execute all promises concurrently
    const usersWithStatusCount = await Promise.all(promises);

    response.status(200).json(usersWithStatusCount);
  } catch (error) {
    console.error("Error in getUsers:", error.message);
    response.status(500).json({ message: error.message });
  }
};

const getUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findById(id);
    response.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUser:", error.message);
    response.status(500).json({ message: error.message });
  }
};

const addUser = async (request, response) => {
  try {
    const addFields = request.body;
    addFields.loggedIn = 0;
    console.log(addFields);
    const duplicateCheckFields = ["fullName", "email", "contact", "username"];
    const { hasDuplicates, duplicateFields } = await checkForDuplicates({
      Model: UserModel,
      requestBody: addFields,
      fieldsToCheck: duplicateCheckFields,
    });

    if (hasDuplicates)
      return response.status(409).json({
        message: `Duplicate values found for fields: ${duplicateFields.join(
          ", "
        )}`,
        duplicates: duplicateFields,
      });

    const user = new UserModel(addFields);
    await user.validate();
    const addedUser = await user.save();
    response.status(200).json(addedUser);
  } catch (error) {
    console.error("Error in addUser:", error);
    response.status(500).json({ message: error.message });
  }
};

const updateUser = async (request, response) => {
  try {
    const { id } = request.params;
    const updatedFields = request.body;
    const duplicateCheckFields = ["fullName", "contact", "email", "username"];
    const { hasDuplicates, duplicateFields } = await checkForDuplicates({
      Model: UserModel,
      requestBody: updatedFields,
      fieldsToCheck: duplicateCheckFields,
      excludeId: id,
    });

    if (hasDuplicates)
      return response.status(409).json({
        message: `Duplicate values found for fields: ${duplicateFields.join(
          ", "
        )}`,
        duplicates: duplicateFields,
      });

    const user = await UserModel.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return response
        .status(404)
        .json({ message: `Cannot find any user with ID: ${id}` });
    }

    response.status(200).json({ user });
  } catch (error) {
    console.error("Error in updateUser:", error.message);
    response.status(500).json({ message: error.message });
  }
};

const deleteUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return response
        .status(404)
        .json({ message: `Cannot find any product with ID ${id}` });
    }
    response.status(200).json(user);
  } catch (error) {
    console.error("Error in deleteUser:", error.message);
    response.status(500).json({ message: error.message });
  }
};
const login = async (request, response) => {
  try {
    const inputUsername = request.body.username;
    const inputPassword = request.body.password;
    const user = await UserModel.findOne({ username: inputUsername });

    if (!user) {
      return response
        .status(401)
        .json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(inputPassword, user.password);
    if (passwordMatch) {
      const userToken = createToken(user.id);
      await UserModel.findByIdAndUpdate(user._id);
      return response
        .cookie("Auth_Token", userToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: cookieExpires,
        })
        .status(200)
        .json({
          user,
          token: userToken,
        });
    } else {
      response.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error in login:", error.message);
    response.status(500).json({ message: error.message });
  }
};
const logout = async (request, response) => {
  try {
    const { id } = request.params;

    await UserModel.findByIdAndUpdate(id);

    response.clearCookie("Auth_Token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    response.status(200).json({
      message: "User logged out and cookie unset!",
      redirectUrl: `/`,
    });
  } catch (error) {
    console.error("Error in logout:", error.message);
    response.status(500).json({ message: error.message });
  } finally {
    response.end();
  }
};

const currentUser = async (request, response) => {
  try {
    const token = request.cookies.Auth_Token;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return response.status(401).json({
          message: "Invalid token",
          token: `token:${token}`,
        });
      }

      try {
        const userId = decoded.id;
        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
          return response.status(404).json({ message: "User not found" });
        }
        response.status(200).json({ user, token });
      } catch (error) {
        console.error("Error in currentUser:", error.message);
        response.status(500).json({ message: error.message });
      }
    });
  } catch (error) {
    console.error("Error in currentUser:", error.message);
    response.status(500).json({ message: error.message });
  }
};

const currentUserMobile = async (request, response) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return response.status(401).json({
          message: "Invalid token",
          token: `token: ${token}`,
        });
      }

      try {
        const userId = decoded.id;
        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
          return response.status(404).json({ message: "User not found" });
        }
        response.status(200).json({ user, token });
      } catch (error) {
        console.error("Error in currentUserMobile:", error.message);
        response.status(500).json({ message: error.message });
      }
    });
  } catch (error) {
    console.error("Error in currentUserMobile:", error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  login,
  logout,
  currentUser,
  currentUserMobile,
};
