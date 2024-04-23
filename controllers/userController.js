const UserModel = require("../model/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
    const userLists = await UserModel.find({});
    response.status(200).json(userLists);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
};
const getUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findById(id);
    response.status(200).json({ user });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
const addUser = async (request, response) => {
  try {
    const {
      fullName,
      email,
      contact,
      username,
      password,
      position,
      applicationStatus,
    } = request.body;

    // Create a new user instance without saving it to catch validation errors
    const user = new UserModel({
      fullName,
      email,
      contact,
      username,
      password,
      position,
      applicationStatus,
    });

    // Validate the user data
    await user.validate();

    // If validation passes, save the user
    const addedUser = await user.save();

    response.status(201).json(addedUser);
  } catch (error) {
    const validationErrors = {};
    if (error.name === "ValidationError") {
      // Validation error occurred
      if (error.errors && Object.keys(error.errors).length > 0) {
        // Extract and send specific validation error messages
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
      }
      response.status(400).json({ errors: validationErrors });
    } else {
      // Other types of errors (e.g., server error)
      console.error(error.message);
      response.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const updateUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findByIdAndUpdate(id, request.body, {
      new: true, // To return the updated document
      runValidators: true, // To run validation defined in your schema
    });

    if (!user) {
      return response
        .status(404)
        .json({ message: `Cannot find any user with ID: ${id}` });
    }

    response.status(200).json({ user });
  } catch (error) {
    const validationErrors = {};
    if (error.name === "ValidationError") {
      // Validation error occurred
      if (error.errors && Object.keys(error.errors).length > 0) {
        // Extract and send specific validation error messages
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
      }
      response.status(400).json({ errors: validationErrors });
    } else {
      // Other types of errors (e.g., server error)
      console.error(error.message);
      response.status(500).json({ message: "Internal Server Error" });
    }
  }
};
const deleteUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return response
        .status(404)
        .json({ message: `cannot find any product  with ID ${id}` });
    }
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
const login = async (request, response) => {
  try {
    const inputUsername = request.body.username;
    const inputPassword = request.body.password;
    const user = await UserModel.findOne({
      username: inputUsername,
    });
    if (!user) {
      return response
        .status(401)
        .json({ message: "Invalid username or password" });
      // User does not exists
    }
    const passwordMatch = await bcrypt.compare(inputPassword, user.password);
    if (passwordMatch) {
      var userToken = createToken(user.id);
      response
        .cookie("Auth_Token", userToken, {
          httpOnly: true, // Recommended for security
          secure: true, // Ensure cookie is only sent over HTTPS
          sameSite: "None", // Set SameSite attribute to prevent CSRF
          maxAge: cookieExpires,
        })
        .status(200)
        .json({
          user: user,
          token: userToken,
        });
    } else {
      response.status(401).json({ message: "Invalid username or password" });
      // Invalid credentials
    }
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
const logout = async (request, response) => {
  try {
    response.clearCookie("Auth_Token");
    response.status(200).json({
      message: "Cookie unset!",
      redirectUrl: `/`,
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
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
        response.status(200).json({ user: user, token: token });
      } catch (error) {
        response.status(500).json({ message: error.message });
      }
    });
  } catch (error) {
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
        response.status(200).json({ user: user, token: token });
      } catch (error) {
        response.status(500).json({ message: error.message });
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
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
