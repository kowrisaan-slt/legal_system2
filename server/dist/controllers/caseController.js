"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCaseDocument = exports.updateCaseMetadata = exports.reviewChangeRequest = exports.requestCaseTypeChange = exports.deleteCase = exports.assignCase = exports.handleInitialDocAction = exports.submitInitialDoc = exports.getCaseById = exports.getCases = exports.createCase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// --- Action Logging Helper ---
const logCaseAction = (caseId, userId, action, details) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.caseActionLog.create({
            data: {
                caseId,
                userId,
                action,
                details
            }
        });
    }
    catch (error) {
        console.error('Failed to log case action:', error);
    }
});
// --- Notification Helpers ---
const notifyRoleCase = (role, message, caseId) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({ where: { role: role } });
    if (users.length === 0)
        return;
    yield prisma.notification.createMany({
        data: users.map(u => ({
            userId: u.id,
            caseId,
            message,
        }))
    });
});
const notifyUserCase = (userId, message, caseId) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.notification.create({
        data: {
            userId,
            caseId,
            message,
        }
    });
});
const clearRoleNotificationsCase = (role, caseId) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({ where: { role: role } });
    const userIds = users.map(u => u.id);
    yield prisma.notification.deleteMany({
        where: {
            caseId,
            userId: { in: userIds }
        }
    });
});
// Create a new Case (Initial Draft)
const createCase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { title, type, court, judge, filingDate, location, description, financialExposure, parties, metadata } = req.body;
        const requiresLegalOfficer = req.body.requiresLegalOfficer !== undefined ? req.body.requiresLegalOfficer : true;
        // Auto-generate Reference Number
        const typePrefixMap = {
            'Money Recovery': 'M',
            'Damages Recovery': 'D',
            'Appeals': 'A',
            'Land Cases': 'L',
            'Criminal Cases': 'C',
            'Other Court / Legal Matters': 'O'
        };
        const prefix = typePrefixMap[type] || 'U'; // U for Unknown
        // Generate a random 4-digit string
        let referenceNumber = '';
        let isUnique = false;
        while (!isUnique) {
            const randomDigits = Math.floor(1000 + Math.random() * 9000).toString(); // 1000 to 9999
            referenceNumber = `${prefix}${randomDigits}`;
            // Check if reference number exists
            const existingCase = yield prisma.case.findUnique({
                where: { referenceNumber }
            });
            if (!existingCase) {
                isUnique = true;
            }
        }
        const newCase = yield prisma.case.create({
            data: {
                title,
                type,
                referenceNumber,
                court,
                judge,
                filingDate: filingDate ? new Date(filingDate) : null,
                location,
                description,
                financialExposure: financialExposure ? parseFloat(financialExposure) : null,
                parties: parties || [],
                metadata: metadata || {},
                createdById: userId,
                status: 'NEW',
                initialDocStatus: 'DRAFT',
                requiresLegalOfficer
            }
        });
        // Notify Supervisors about the new case
        yield notifyRoleCase('SUPERVISOR', `New Case Created: ${newCase.referenceNumber} - ${newCase.title}`, newCase.id);
        yield notifyUserCase(newCase.createdById, `Your case ${newCase.referenceNumber} was successfully created.`, newCase.id);
        yield logCaseAction(newCase.id, userId, 'CREATED', 'Case created');
        res.status(201).json(newCase);
    }
    catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ message: 'Failed to create case', error: error.message || error });
    }
});
exports.createCase = createCase;
// Get all Cases (with filters)
const getCases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, type, search } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (type)
            whereClause.type = type;
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { referenceNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Access Control
        if (userRole === 'USER') {
            whereClause.createdById = userId;
        }
        else if (userRole === 'LO') {
            // LO sees:
            // 1. Cases assigned to them
            // 2. Cases they created
            // 3. Unassigned cases that REQUIRE a Legal Officer (pool to pick from)
            whereClause.OR = [
                { assignedLoId: userId },
                { createdById: userId },
                {
                    AND: [
                        { assignedLoId: null },
                        { requiresLegalOfficer: true },
                        { status: { not: 'CLOSED' } }
                    ]
                }
            ];
            // If they are searching, we need to wrap the OR logic to avoid overriding search
            if (search) {
                // Combining complex ORs with Prisma can be tricky.
                // Let's refine: (UserFilter) AND (SearchFilter)
                // The 'OR' above was overriding the 'OR' for search if not careful.
                // Correct approach for Prisma:
                /*
                  where: {
                     AND: [
                        { <role based logic> },
                        { <search logic> },
                        { <filter logic> }
                     ]
                  }
                  But we started with `whereClause` as object.
                */
            }
        }
        // SUPERVISOR / ADMIN / CLO sees all (subject to filters)
        // Refined Query Construction to safely combine Role Access with Headers
        const finalWhere = {
            AND: []
        };
        // 1. Status & Type Filters
        if (status)
            finalWhere.AND.push({ status: status });
        if (type)
            finalWhere.AND.push({ type: type });
        // 2. Search Filter
        if (search) {
            finalWhere.AND.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { referenceNumber: { contains: search, mode: 'insensitive' } }
                ]
            });
        }
        // 3. Role Access Filter
        if (userRole === 'USER') {
            finalWhere.AND.push({ createdById: userId });
        }
        else if (userRole === 'LO') {
            finalWhere.AND.push({
                OR: [
                    { assignedLoId: userId },
                    { createdById: userId },
                    {
                        AND: [
                            { assignedLoId: null },
                            { requiresLegalOfficer: true },
                            { status: { not: 'CLOSED' } }
                        ]
                    }
                ]
            });
        }
        const cases = yield prisma.case.findMany({
            where: finalWhere,
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { name: true, email: true } },
                assignedLo: { select: { name: true, email: true } }
            }
        });
        res.json(cases);
    }
    catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ message: 'Failed to fetch cases' });
    }
});
exports.getCases = getCases;
// Get Single Case Details
const getCaseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const caseData = yield prisma.case.findUnique({
            where: { id },
            include: {
                createdBy: { select: { name: true, email: true } },
                assignedLo: { select: { name: true, email: true } },
                initialDocVersions: { orderBy: { version: 'desc' }, take: 1 }, // Corrected versionNumber to version
                documents: true,
                events: true,
                changeRequests: true,
                actionLogs: { include: { user: { select: { name: true } } }, orderBy: { timestamp: 'desc' } }
            }
        });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        res.json(caseData);
    }
    catch (error) {
        console.error('Get case details error:', error);
        res.status(500).json({ message: 'Failed to fetch case details' });
    }
});
exports.getCaseById = getCaseById;
// Submit Initial Doc for Approval
const submitInitialDoc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        if (caseData.createdById !== userId) {
            res.status(403).json({ message: 'Only the creator can submit this case' });
            return;
        }
        const updatedCase = yield prisma.case.update({
            where: { id },
            data: {
                initialDocStatus: 'PENDING_APPROVAL',
                initialDocVersions: {
                    create: {
                        version: 1,
                        content: JSON.parse(JSON.stringify(caseData)),
                        createdById: userId,
                        status: 'PENDING_APPROVAL'
                    }
                }
            }
        });
        yield logCaseAction(id, userId, 'SUBMITTED', 'Initial document submitted for approval');
        res.json({ message: 'Case submitted for approval', case: updatedCase });
    }
    catch (error) {
        console.error('Submit execution error:', error);
        res.status(500).json({ message: 'Failed to submit case' });
    }
});
exports.submitInitialDoc = submitInitialDoc;
// Handle Supervisor Action (Approve/Reject/Request Change)
const handleInitialDocAction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { action, remarks } = req.body; // action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGE'
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'SUPERVISOR' && userRole !== 'CLO' && userRole !== 'ADMIN') {
            res.status(403).json({ message: 'Unauthorized action' });
            return;
        }
        let newStatus = 'PENDING_APPROVAL';
        let caseStatus = 'NEW';
        if (action === 'APPROVE') {
            newStatus = 'APPROVED';
            caseStatus = 'ACTIVE';
        }
        else if (action === 'REJECT') {
            newStatus = 'REJECTED';
            // Case status remains NEW or goes to CLOSED? Let's keep NEW for now.
        }
        else if (action === 'REQUEST_CHANGE') {
            newStatus = 'REVISION_REQUIRED';
        }
        const updatedCase = yield prisma.case.update({
            where: { id },
            data: {
                initialDocStatus: newStatus,
                status: caseStatus
                // In a real app, we'd update the InitialDocVersion status too
            }
        });
        // Notifications logic
        if (action === 'APPROVE') {
            if (updatedCase.requiresLegalOfficer) {
                yield notifyRoleCase('LO', `New Active Case needs Assignment: ${updatedCase.referenceNumber} - ${updatedCase.title}`, updatedCase.id);
            }
            else {
                yield notifyRoleCase('ADMIN', `Case ${updatedCase.referenceNumber} approved by Supervisor (No Legal Officer required).`, updatedCase.id);
            }
            yield notifyUserCase(updatedCase.createdById, `Your case ${updatedCase.referenceNumber} has been APPROVED by a supervisor.`, updatedCase.id);
        }
        else if (action === 'REJECT') {
            yield notifyUserCase(updatedCase.createdById, `Your case ${updatedCase.referenceNumber} has been REJECTED.`, updatedCase.id);
        }
        else if (action === 'REQUEST_CHANGE') {
            yield notifyUserCase(updatedCase.createdById, `Revisions are required for your case ${updatedCase.referenceNumber}.`, updatedCase.id);
        }
        yield logCaseAction(id, userId, action, remarks ? 'Remarks: ' + remarks : undefined);
        res.json({ message: `Case ${action.toLowerCase()}ed`, case: updatedCase });
    }
    catch (error) {
        console.error('Review action error:', error);
        res.status(500).json({ message: 'Failed to process review action' });
    }
});
exports.handleInitialDocAction = handleInitialDocAction;
// Assign Case (Self-pickup or Supervisor assignment)
const assignCase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { assignedLoId } = req.body; // Optional: If provided, assigning to specific LO.
        const userId = req.user.userId;
        const userRole = req.user.role;
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        // Logic:
        // 1. LO picking up unassigned case:
        if (userRole === 'LO') {
            if (caseData.assignedLoId) {
                res.status(400).json({ message: 'Case is already assigned' });
                return;
            }
            if (!caseData.requiresLegalOfficer) {
                res.status(400).json({ message: 'This case does not require a Legal Officer' });
                return;
            }
            const updatedCase = yield prisma.case.update({
                where: { id },
                data: { assignedLoId: userId },
                include: { assignedLo: { select: { name: true } } }
            });
            yield notifyUserCase(caseData.createdById, `Legal Officer ${(_a = updatedCase.assignedLo) === null || _a === void 0 ? void 0 : _a.name} has taken up your case ${caseData.referenceNumber}.`, caseData.id);
            yield notifyRoleCase('ADMIN', `Legal Officer ${(_b = updatedCase.assignedLo) === null || _b === void 0 ? void 0 : _b.name} has taken up case ${caseData.referenceNumber}.`, caseData.id);
            yield logCaseAction(id, userId, 'ASSIGNED', 'Assigned by self-pickup');
            res.json({ message: 'Case successfully assigned to you' });
            return;
        }
        // 2. Supervisor assigning to LO:
        if (userRole === 'SUPERVISOR' || userRole === 'ADMIN' || userRole === 'CLO') {
            if (!assignedLoId) {
                res.status(400).json({ message: 'Legal Officer ID is required' });
                return;
            }
            // Verify target user is an LO
            const targetUser = yield prisma.user.findUnique({ where: { id: assignedLoId } });
            if (!targetUser || targetUser.role !== 'LO') {
                res.status(400).json({ message: 'Target user is not a Legal Officer' });
                return;
            }
            yield prisma.case.update({
                where: { id },
                data: { assignedLoId }
            });
            yield notifyUserCase(caseData.createdById, `Legal Officer ${targetUser.name} has been assigned to your case ${caseData.referenceNumber}.`, caseData.id);
            yield notifyRoleCase('ADMIN', `Legal Officer ${targetUser.name} has been assigned to case ${caseData.referenceNumber}.`, caseData.id);
            yield logCaseAction(id, userId, 'ASSIGNED', `Assigned to ${targetUser.name} by Supervisor`);
            res.json({ message: `Case assigned to ${targetUser.name}` });
            return;
        }
        res.status(403).json({ message: 'Not authorized to assign cases' });
    }
    catch (error) {
        console.error('Assign case error:', error);
        res.status(500).json({ message: 'Failed to assign case', error: error.message || error });
    }
});
exports.assignCase = assignCase;
// Delete Case
const deleteCase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            res.status(403).json({ message: 'Only Admins can delete cases' });
            return;
        }
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        yield prisma.case.delete({
            where: { id }
        });
        res.json({ message: 'Case deleted successfully' });
    }
    catch (error) {
        console.error('Delete case error:', error);
        res.status(500).json({ message: 'Failed to delete case', error: error.message || error });
    }
});
exports.deleteCase = deleteCase;
// Request Case Type Change
const requestCaseTypeChange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { newType } = req.body;
        const userId = req.user.userId;
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        if (caseData.createdById !== userId) {
            res.status(403).json({ message: 'Only the creator can request a type change' });
            return;
        }
        if (caseData.status !== 'ACTIVE') {
            res.status(400).json({ message: 'Type change can only be requested for ACTIVE cases' });
            return;
        }
        // Check for existing pending requests
        const existingRequest = yield prisma.changeRequest.findFirst({
            where: {
                caseId: id,
                type: 'CASE_TYPE',
                status: 'PENDING'
            }
        });
        if (existingRequest) {
            res.status(400).json({ message: 'A case type change request is already pending' });
            return;
        }
        yield prisma.changeRequest.create({
            data: {
                caseId: id,
                requestedById: userId,
                type: 'CASE_TYPE',
                data: { newType }
            }
        });
        yield notifyRoleCase('SUPERVISOR', `A type change request has been submitted for case ${caseData.referenceNumber}.`, caseData.id);
        yield logCaseAction(id, userId, 'TYPE_CHANGE_REQUESTED', `Requested type change to: ${newType}`);
        res.status(201).json({ message: 'Case type change request submitted' });
    }
    catch (error) {
        console.error('Request type change error:', error);
        res.status(500).json({ message: 'Failed to request case type change', error: error.message || error });
    }
});
exports.requestCaseTypeChange = requestCaseTypeChange;
// Review Change Request
const reviewChangeRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { changeId } = req.params;
        const { action, remarks } = req.body; // 'APPROVE' | 'REJECT'
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (!['SUPERVISOR', 'CLO', 'ADMIN'].includes(userRole)) {
            res.status(403).json({ message: 'Unauthorized review action' });
            return;
        }
        const changeRequest = yield prisma.changeRequest.findUnique({
            where: { id: changeId },
            include: { case: true }
        });
        if (!changeRequest || changeRequest.status !== 'PENDING') {
            res.status(404).json({ message: 'Pending change request not found' });
            return;
        }
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        yield prisma.changeRequest.update({
            where: { id: changeId },
            data: {
                status: newStatus,
                reviewerId: userId,
                remarks
            }
        });
        if (newStatus === 'APPROVED' && changeRequest.type === 'CASE_TYPE') {
            const data = changeRequest.data;
            yield prisma.case.update({
                where: { id: changeRequest.caseId },
                data: { type: data.newType }
            });
        }
        const actionText = newStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED';
        yield notifyUserCase(changeRequest.requestedById, `Your request to change the case type for ${changeRequest.case.referenceNumber} has been ${actionText}.`, changeRequest.caseId);
        yield logCaseAction(changeRequest.caseId, userId, newStatus === 'APPROVED' ? 'TYPE_CHANGE_APPROVED' : 'TYPE_CHANGE_REJECTED', remarks ? 'Remarks: ' + remarks : undefined);
        res.json({ message: `Change request ${actionText.toLowerCase()}` });
    }
    catch (error) {
        console.error('Review change request error:', error);
        res.status(500).json({ message: 'Failed to process change request', error: error.message || error });
    }
});
exports.reviewChangeRequest = reviewChangeRequest;
// Update Case Metadata
const updateCaseMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { metadata } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        // Only Creator, Assigned LO, Supervisor, CLO, Admin can update
        const canUpdate = userRole === 'ADMIN' ||
            userRole === 'CLO' ||
            userRole === 'SUPERVISOR' ||
            (userRole === 'USER' && caseData.createdById === userId) ||
            (userRole === 'LO' && caseData.assignedLoId === userId);
        if (!canUpdate) {
            res.status(403).json({ message: 'Not authorized to update metadata for this case' });
            return;
        }
        // Merge existing metadata with new metadata
        // Handle case where metadata is null or not an object
        let existingMetadata = {};
        if (caseData.metadata && typeof caseData.metadata === 'object' && !Array.isArray(caseData.metadata)) {
            existingMetadata = caseData.metadata;
        }
        const updatedMetadata = Object.assign(Object.assign({}, existingMetadata), metadata);
        yield prisma.case.update({
            where: { id },
            data: { metadata: updatedMetadata }
        });
        yield logCaseAction(id, userId, 'METADATA_UPDATED', 'Updated case tracking details');
        res.json({ message: 'Case metadata updated successfully', metadata: updatedMetadata });
    }
    catch (error) {
        console.error('Update case metadata error:', error);
        res.status(500).json({ message: 'Failed to update case metadata', error: error.message || error });
    }
});
exports.updateCaseMetadata = updateCaseMetadata;
// Upload Case Document
const uploadCaseDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, category } = req.body;
        const userId = req.user.userId;
        if (!req.file) {
            res.status(400).json({ message: 'No document uploaded' });
            return;
        }
        const caseData = yield prisma.case.findUnique({ where: { id } });
        if (!caseData) {
            res.status(404).json({ message: 'Case not found' });
            return;
        }
        const newDoc = yield prisma.caseDocument.create({
            data: {
                caseId: id,
                title: title || req.file.originalname,
                category: category || 'Other',
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                uploadedById: userId,
                version: 1
            }
        });
        yield logCaseAction(id, userId, 'DOCUMENT_UPLOADED', `Uploaded document: ${newDoc.title}`);
        res.status(201).json({ message: 'Document uploaded successfully', document: newDoc });
    }
    catch (error) {
        console.error('Upload case document error:', error);
        res.status(500).json({ message: 'Failed to upload document', error: error.message || error });
    }
});
exports.uploadCaseDocument = uploadCaseDocument;
