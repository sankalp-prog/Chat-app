import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import db from './lib/db.js';

dotenv.config();
const app = express();
db.connect();

console.log('index.js ' + process.env.PORT);

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});
