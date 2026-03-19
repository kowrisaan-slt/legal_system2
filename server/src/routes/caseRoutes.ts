import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { createCase, getCases, getCaseById, submitInitialDoc, handleInitialDocAction, assignCase, deleteCase, requestCaseTypeChange, reviewChangeRequest, updateCaseMetadata, uploadCaseDocument } from '../controllers/caseController';
import upload from '../middleware/upload';

const router = Router();

// Create Case (User, LO, Supervisor can create)
router.post('/', authenticateToken, authorizeRoles(['USER', 'LO', 'SUPERVISOR', 'CLO', 'ADMIN']), createCase);

// Get Cases
router.get('/', authenticateToken, getCases);

// Get Case Details
router.get('/:id', authenticateToken, getCaseById);

// Submit Initial Doc
router.post('/:id/submit', authenticateToken, authorizeRoles(['USER', 'LO', 'SUPERVISOR']), submitInitialDoc);

// Approve/Reject Initial Doc
router.post('/:id/review', authenticateToken, authorizeRoles(['SUPERVISOR', 'CLO', 'ADMIN']), handleInitialDocAction);

// Assign Case (LO pickup or Supervisor assign)
router.post('/:id/assign', authenticateToken, authorizeRoles(['LO', 'SUPERVISOR', 'CLO', 'ADMIN']), assignCase);

// Request Case Type Change (Creator only)
router.post('/:id/change-type', authenticateToken, authorizeRoles(['USER', 'LO', 'SUPERVISOR', 'CLO', 'ADMIN']), requestCaseTypeChange);

// Review Change Request (Supervisor+)
router.post('/changes/:changeId/review', authenticateToken, authorizeRoles(['SUPERVISOR', 'CLO', 'ADMIN']), reviewChangeRequest);

// Delete Case (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN']), deleteCase);

// Update Case Metadata
router.put('/:id/metadata', authenticateToken, updateCaseMetadata);

// Upload Case Document
router.post('/:id/documents', authenticateToken, upload.single('document'), uploadCaseDocument);

export default router;
