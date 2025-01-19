import { dbConfig as db } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';

async function getUser(email) {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function addNewUser(name, email, pwd) {
  const result = await db.query('INSERT INTO users (email, full_name, password) VALUES ($1, $2, $3) RETURNING id, email, full_name, profile_pic', [email, name, pwd]);
  return result.rows[0];
}

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

    const userExists = await getUser(email);
    // check if the record already exists by filtering the email
    if (userExists) {
      console.log('userExists: ');
      console.log(userExists);
      return res.status(400).json({ message: 'Email already exists' });
    }
    const newUser = await addNewUser(fullName, email, hash);
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
    const existingUser = await getUser(email);
    console.log('user exists: ', existingUser);
    if (existingUser) {
      const passwordMatch = bcrypt.compareSync(password, existingUser.password);
      if (passwordMatch) {
        // generate jwt token and send to the user
        generateToken(existingUser, res);
        res.status(200).json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Incorrect password' });
      }
    } else {
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
