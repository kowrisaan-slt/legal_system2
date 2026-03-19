import express from 'express';
import { createUser, getLegalOfficers, getAllUsers, deleteUser } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// User Management (Admin only)
router.post('/', authenticateToken, authorizeRoles(['ADMIN']), createUser);
router.get('/', authenticateToken, authorizeRoles(['ADMIN']), getAllUsers);
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN']), deleteUser);

// Get Legal Officers (For Supervisors to assign cases)
router.get('/legal-officers', authenticateToken, authorizeRoles(['SUPERVISOR', 'CLO', 'ADMIN']), getLegalOfficers);

export default router;
