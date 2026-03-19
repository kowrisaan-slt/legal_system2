"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const caseController_1 = require("../controllers/caseController");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
// Create Case (User, LO, Supervisor can create)
router.post('/', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['USER', 'LO', 'SUPERVISOR', 'CLO', 'ADMIN']), caseController_1.createCase);
// Get Cases
router.get('/', auth_1.authenticateToken, caseController_1.getCases);
// Get Case Details
router.get('/:id', auth_1.authenticateToken, caseController_1.getCaseById);
// Submit Initial Doc
router.post('/:id/submit', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['USER', 'LO', 'SUPERVISOR']), caseController_1.submitInitialDoc);
// Approve/Reject Initial Doc
router.post('/:id/review', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['SUPERVISOR', 'CLO', 'ADMIN']), caseController_1.handleInitialDocAction);
// Assign Case (LO pickup or Supervisor assign)
router.post('/:id/assign', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['LO', 'SUPERVISOR', 'CLO', 'ADMIN']), caseController_1.assignCase);
// Request Case Type Change (Creator only)
router.post('/:id/change-type', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['USER', 'LO', 'SUPERVISOR', 'CLO', 'ADMIN']), caseController_1.requestCaseTypeChange);
// Review Change Request (Supervisor+)
router.post('/changes/:changeId/review', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['SUPERVISOR', 'CLO', 'ADMIN']), caseController_1.reviewChangeRequest);
// Delete Case (Admin only)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['ADMIN']), caseController_1.deleteCase);
// Update Case Metadata
router.put('/:id/metadata', auth_1.authenticateToken, caseController_1.updateCaseMetadata);
// Upload Case Document
router.post('/:id/documents', auth_1.authenticateToken, upload_1.default.single('document'), caseController_1.uploadCaseDocument);
exports.default = router;
