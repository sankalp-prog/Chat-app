import * as User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be atleast 6 characters' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const userExists = await User.findUser('email', email);
    // check if the record already exists by filtering the email
    if (userExists) {
      console.log('userExists: ');
      console.log(userExists);
      return res.status(400).json({ message: 'Email already exists' });
    }
    const newUser = await User.addNewUser(fullName, email, hash);
    // Test and check once
    if (newUser) {
      // generate jwt token
      generateToken(newUser.id, res);
      res.status(201).json({
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.log('error in signup controller: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  // TODO: user sends an email & pwd, check it against the db
  // if user email exists in the db, check the pwd to validate.
  // if user exists then do the same as signup which is generate the jwt token and return it
  try {
    const { email, password } = req.body;
    console.log('email: ', email);
    const existingUser = await User.findUser('email', email);
    console.log('user exists: ', existingUser);
    if (existingUser) {
      const passwordMatch = bcrypt.compareSync(password, existingUser.password);
      if (passwordMatch) {
        // generate jwt token and send to the user
        generateToken(existingUser, res);
        res.status(200).json({ message: 'Login successful' });
      } else {
        // maybe make a more generic message else a hacker will know which field is correct and which to keep guessing
        res.status(401).json({ message: 'Incorrect password' });
      }
    } else {
      // maybe make a more generic message else a hacker will know which field is correct and which to keep guessing
      res.status(401).json({ message: 'User does not exist' });
    }
  } catch (error) {
    console.log('error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const logout = (req, res) => {
  // TODO: Remove the jwt token from the cookies [empty string]
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Successfully Logged out' });
  } catch (error) {
    console.log('error in logout controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// not tested yet, will test when frontend is made
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user.id;

    if (!profilePic) {
      return res.status(400).json({ message: 'Profile pic is required' });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findAndUpdate(userId, 'profile_pic', uploadResponse.secure_url);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log('error in update profile: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
