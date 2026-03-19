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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAgreement = exports.markNotificationRead = exports.getNotifications = exports.getDashboardStats = exports.updateStatus = exports.addComment = exports.uploadVersion = exports.getAgreementById = exports.getAgreements = exports.createAgreement = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const actionLogger_1 = require("../utils/actionLogger");
// Helper to ensure ID is string
const getId = (id) => {
    if (!id || typeof id !== 'string')
        return null;
    return id;
};
// --- Notification Helpers ---
const notifyRole = (role, message, agreementId) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma_1.default.user.findMany({ where: { role: role } });
    if (users.length === 0)
        return;
    yield prisma_1.default.notification.createMany({
        data: users.map(u => ({
            userId: u.id,
            agreementId,
            message,
        }))
    });
});
const notifyUser = (userId, message, agreementId) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.notification.create({
        data: {
            userId,
            agreementId,
            message,
        }
    });
});
const clearRoleNotifications = (role, agreementId) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma_1.default.user.findMany({ where: { role: role } });
    const userIds = users.map(u => u.id);
    yield prisma_1.default.notification.deleteMany({
        where: {
            agreementId,
            userId: { in: userIds }
        }
    });
});
// Create Agreement
const createAgreement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, type, parties, value, duration, caseId } = req.body;
    const userId = req.user.userId;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'Initial draft document is required' });
    }
    try {
        // Sanitize inputs
        let cleanCaseId = (caseId && typeof caseId === 'string' && caseId.trim() !== '' && caseId !== 'null' && caseId !== 'undefined') ? caseId.trim() : null;
        let resolvedCaseId = null;
        if (cleanCaseId) {
            // Check if it's a UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUuid = uuidRegex.test(cleanCaseId);
            let existingCase = null;
            if (isUuid) {
                existingCase = yield prisma_1.default.case.findUnique({ where: { id: cleanCaseId } });
            }
            else {
                // If not UUID, assume it's a Reference Number (e.g., CASE-2024-001)
                existingCase = yield prisma_1.default.case.findUnique({ where: { referenceNumber: cleanCaseId } });
            }
            if (!existingCase) {
                return res.status(400).json({ message: `Case not found with identifier: '${cleanCaseId}'. Please key in a valid Case ID or Reference Number.` });
            }
            resolvedCaseId = existingCase.id;
        }
        let parsedValue = null;
        if (value && value !== 'null' && value !== 'undefined') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                parsedValue = parsed;
            }
        }
        const agreement = yield prisma_1.default.agreement.create({
            data: {
                title,
                type,
                parties: typeof parties === 'string' ? JSON.parse(parties) : parties, // Handle if already parsed (though multer usually gives string)
                value: parsedValue,
                duration: (duration && duration !== 'null' && duration !== 'undefined') ? duration : null,
                caseId: resolvedCaseId, // Use the resolved DB ID
                createdById: userId,
                status: 'DRAFT', // Explicitly set even if default
                versions: {
                    create: {
                        versionNumber: 1,
                        filePath: file.path,
                        uploadedById: userId,
                        changeLog: 'Initial Draft',
                    },
                },
            },
        });
        yield (0, actionLogger_1.logAction)(agreement.id, userId, 'CREATED', 'Agreement created with initial draft');
        // Notify Creator
        // await notifyUser(userId, `Agreement "${agreement.title}" created successfully.`, agreement.id);
        // If we decided to auto-submit or just notify admins of new draft (optional, user didn't ask for this specifically for DRAFT)
        // keeping it simple as per request: "if a user created and summited..." -> implies submit action. 
        // asking for "in each stage, user who creates ... should get notification"
        // So let's notify them it is created.
        yield notifyUser(userId, `You created agreement: ${agreement.title}`, agreement.id);
        res.status(201).json(agreement);
    }
    catch (error) {
        console.error('Error creating agreement:', error);
        res.status(500).json({ message: 'Error creating agreement', error: error.message || error });
    }
});
exports.createAgreement = createAgreement;
// Get Agreements
const getAgreements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agreements = yield prisma_1.default.agreement.findMany({
            include: {
                createdBy: { select: { name: true, email: true } },
                versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
                case: { select: { referenceNumber: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(agreements);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching agreements', error });
    }
});
exports.getAgreements = getAgreements;
// Get Single Agreement Details
const getAgreementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid ID' });
    try {
        const agreement = yield prisma_1.default.agreement.findUnique({
            where: { id },
            include: {
                createdBy: { select: { name: true, email: true } },
                versions: { include: { uploadedBy: { select: { name: true } } }, orderBy: { versionNumber: 'desc' } },
                comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
                actions: { include: { user: { select: { name: true } } }, orderBy: { timestamp: 'desc' } },
                case: { select: { referenceNumber: true } },
            },
        });
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }
        res.json(agreement);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching agreement details', error });
    }
});
exports.getAgreementById = getAgreementById;
// Upload New Version
const uploadVersion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid ID' });
    const { changeLog, parties, value, duration, type } = req.body;
    const userId = req.user.userId;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'Document file is required' });
    }
    try {
        const agreement = yield prisma_1.default.agreement.findUnique({ where: { id }, include: { versions: true } });
        if (!agreement)
            return res.status(404).json({ message: 'Agreement not found' });
        // Parse optional numeric value
        let parsedValue = null;
        if (value && value !== 'null' && value !== 'undefined' && value !== '') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                parsedValue = parsed;
            }
        }
        // Parse parties if string
        const parsedParties = (parties && typeof parties === 'string')
            ? parties.split(',').map((p) => p.trim()).filter((p) => p !== '')
            : agreement.parties; // Keep existing if not provided
        const newVersionNumber = agreement.versions.length + 1;
        // Transaction to ensure atomicity
        const [version, updatedAgreement] = yield prisma_1.default.$transaction([
            prisma_1.default.agreementVersion.create({
                data: {
                    agreementId: id,
                    versionNumber: newVersionNumber,
                    filePath: file.path,
                    uploadedById: userId,
                    changeLog,
                },
            }),
            prisma_1.default.agreement.update({
                where: { id },
                data: {
                    status: 'PENDING_REVIEW', // Reset status on new version
                    parties: (parsedParties || agreement.parties),
                    value: parsedValue !== null ? parsedValue : agreement.value,
                    duration: duration || agreement.duration,
                    type: type || agreement.type
                }
            })
        ]);
        yield (0, actionLogger_1.logAction)(id, userId, 'REVISED', `Uploaded version ${newVersionNumber} with metadata updates`);
        // Notify Reviewers of new version
        yield notifyRole('REVIEWER', `New version uploaded for ${agreement.title}`, id);
        // Notify Creator
        yield notifyUser(agreement.createdById, `New version uploaded for your agreement: ${agreement.title}`, id);
        res.status(201).json(version);
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading version', error });
    }
});
exports.uploadVersion = uploadVersion;
// Add Comment
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid ID' });
    const { content } = req.body;
    const userId = req.user.userId;
    try {
        const comment = yield prisma_1.default.comment.create({
            data: {
                agreementId: id,
                userId,
                content,
            },
        });
        yield (0, actionLogger_1.logAction)(id, userId, 'COMMENTED');
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
});
exports.addComment = addComment;
// Change Status (Submit, Approve, Reject)
const updateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid ID' });
    const { status, remarks } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    try {
        const agreement = yield prisma_1.default.agreement.findUnique({ where: { id } });
        if (!agreement)
            return res.status(404).json({ message: 'Agreement not found' });
        let newStatus = agreement.status;
        let actionType = '';
        if (status === 'SUBMIT' && agreement.status === 'DRAFT') {
            newStatus = 'PENDING_REVIEW';
            actionType = 'SUBMITTED';
            // Notify Reviewers
            yield notifyRole('REVIEWER', `Agreement submitted for review: ${agreement.title}`, id);
            // Notify Creator
            yield notifyUser(agreement.createdById, `You submitted ${agreement.title} for review`, id);
        }
        else if (status === 'APPROVE') {
            if (userRole === 'REVIEWER' && agreement.status === 'PENDING_REVIEW') {
                newStatus = 'PENDING_APPROVAL';
                actionType = 'REVIEWED & APPROVED';
                // Notify Approvers
                yield notifyRole('APPROVER', `Agreement pending approval: ${agreement.title}`, id);
                // Notify Creator
                yield notifyUser(agreement.createdById, `Your agreement ${agreement.title} was reviewed and approved by reviewer`, id);
                // Clear Reviewer Notifications
                yield clearRoleNotifications('REVIEWER', id);
            }
            else if (userRole === 'APPROVER' && agreement.status === 'PENDING_APPROVAL') {
                newStatus = 'APPROVED';
                actionType = 'APPROVED';
                // Notify CLO
                yield notifyRole('CLO', `Agreement approved and ready for execution: ${agreement.title}`, id);
                // Notify Creator
                yield notifyUser(agreement.createdById, `Your agreement ${agreement.title} was approved`, id);
                // Clear Approver Notifications
                yield clearRoleNotifications('APPROVER', id);
            }
            else {
                return res.status(403).json({ message: 'Invalid status transition for this role' });
            }
        }
        else if (status === 'REJECT') {
            newStatus = 'REJECTED';
            actionType = 'REJECTED';
            // Notify Creator
            yield notifyUser(agreement.createdById, `Your agreement ${agreement.title} was rejected`, id);
            // Clear current role notifications (if Reviewer rejected, clear Reviewer tasks)
            yield clearRoleNotifications(userRole, id);
        }
        else if (status === 'REQUEST_CHANGE') {
            newStatus = 'REVISION_REQUIRED';
            actionType = 'CHANGE REQUESTED';
            // Notify Creator
            yield notifyUser(agreement.createdById, `Change requested for ${agreement.title}`, id);
            // Clear current role notifications
            yield clearRoleNotifications(userRole, id);
        }
        else if (status === 'EXECUTED') {
            if (userRole === 'CLO' && agreement.status === 'APPROVED') {
                newStatus = 'EXECUTED';
                actionType = 'EXECUTED';
                // Notify Creator
                yield notifyUser(agreement.createdById, `Your agreement ${agreement.title} has been executed`, id);
                // Clear CLO Notifications
                yield clearRoleNotifications('CLO', id);
            }
            else {
                return res.status(403).json({ message: 'Only CLO can execute approved agreements' });
            }
        }
        else {
            return res.status(400).json({ message: 'Invalid status action' });
        }
        yield prisma_1.default.agreement.update({
            where: { id },
            data: { status: newStatus }
        });
        yield (0, actionLogger_1.logAction)(id, userId, actionType, remarks);
        res.json({ message: `Agreement status updated to ${newStatus}`, status: newStatus });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
});
exports.updateStatus = updateStatus;
// Get Dashboard Stats
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield prisma_1.default.agreement.groupBy({
            by: ['status'],
            _count: {
                _all: true,
            },
        });
        const formattedStats = {
            active: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
        };
        stats.forEach(s => {
            const count = s._count._all;
            if (s.status === 'DRAFT' || s.status === 'REVISION_REQUIRED' || s.status === 'EXECUTED') {
                formattedStats.active += count;
            }
            else if (s.status === 'PENDING_REVIEW' || s.status === 'PENDING_APPROVAL') {
                formattedStats.pending += count;
            }
            else if (s.status === 'APPROVED') {
                formattedStats.approved += count;
            }
            else if (s.status === 'REJECTED') {
                formattedStats.rejected += count;
            }
        });
        const recentActivity = yield prisma_1.default.actionLog.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: {
                user: { select: { name: true } },
                agreement: { select: { title: true } }
            }
        });
        res.json({
            counts: formattedStats,
            activity: recentActivity
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});
exports.getDashboardStats = getDashboardStats;
// Get Notifications
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    try {
        const notifications = yield prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
});
exports.getNotifications = getNotifications;
// Mark Notification Read
const markNotificationRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = getId(req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid ID' });
    try {
        yield prisma_1.default.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
});
exports.markNotificationRead = markNotificationRead;
// Delete Agreement (Admin only)
const deleteAgreement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getId(req.params.id);
        if (!id)
            return res.status(400).json({ message: 'Invalid ID' });
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            res.status(403).json({ message: 'Only administrators can delete agreements' });
            return;
        }
        const agreement = yield prisma_1.default.agreement.findUnique({ where: { id } });
        if (!agreement) {
            res.status(404).json({ message: 'Agreement not found' });
            return;
        }
        yield prisma_1.default.agreement.delete({
            where: { id }
        });
        res.json({ message: 'Agreement deleted successfully' });
    }
    catch (error) {
        console.error('Delete agreement error:', error);
        res.status(500).json({ message: 'Failed to delete agreement' });
    }
});
exports.deleteAgreement = deleteAgreement;
