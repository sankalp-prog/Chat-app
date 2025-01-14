import { dbConfig as db } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';

async function userExists(email) {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function addNewUser(name, email, pwd) {
  // const result = await db.query(`INSERT INTO user (email, full_name, password) VALUES (${email}, ${name}, ${pwd})`);
  // NOTE: Above code is open to sql injection attacks
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

    // check if the record already exists by filtering the email
    if (await userExists(email)) {
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
    console.log('error in signup controller: ', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = (req, res) => {
  res.send('login route');
};

export const logout = (req, res) => {
  res.send('logout route');
};
