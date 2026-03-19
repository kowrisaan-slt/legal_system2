import express from 'express';
import {
    createAgreement,
    getAgreements,
    getAgreementById,
    uploadVersion,
    addComment,
    updateStatus,
    getDashboardStats,
    getNotifications,
    markNotificationRead,
    deleteAgreement
} from '../controllers/agreementController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.get('/notifications', authenticateToken as any, getNotifications);
router.put('/notifications/:id/read', authenticateToken as any, markNotificationRead);
router.get('/stats', authenticateToken as any, getDashboardStats);
router.post('/', authenticateToken as any, upload.single('document'), createAgreement);
router.get('/', authenticateToken as any, getAgreements);
router.get('/:id', authenticateToken as any, getAgreementById);
router.post('/:id/versions', authenticateToken as any, upload.single('document'), uploadVersion);
router.post('/:id/comments', authenticateToken as any, addComment);
router.put('/:id/status', authenticateToken as any, updateStatus);
router.delete('/:id', authenticateToken as any, authorizeRoles(['ADMIN']), deleteAgreement);

export default router;
