import jwt from 'jsonwebtoken';
import * as User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  // 1. Get token from req and return if no token provided
  // 2. Convert/decode the payload, if it's invalid then return
  // 3. If it's valid then use the userId stored in it to find user from db
  // 4. if user found then store it in req.user and go next
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No Token Provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('protectRoute/decoded.userId: ', decoded.userId);

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized - Invalid Token' });
    }

    const user = await User.findUser('id', decoded.userId.id);
    console.log('protectRoute/user: ', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute middleware: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
