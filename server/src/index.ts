import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import agreementRoutes from './routes/agreementRoutes';
import userRoutes from './routes/userRoutes';
import caseRoutes from './routes/caseRoutes';
import './utils/scheduler'; // Start scheduler

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/agreements', agreementRoutes);
app.use('/users', userRoutes);
app.use('/cases', caseRoutes);

app.get('/', (req, res) => {
    res.send('Agreement Approval Management API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
