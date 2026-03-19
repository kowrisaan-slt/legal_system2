import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../utils/actionLogger';
import { AgreementStatus } from '@prisma/client';

// Helper to ensure ID is string
const getId = (id: string | undefined): string | null => {
    if (!id || typeof id !== 'string') return null;
    return id;
};

// --- Notification Helpers ---

const notifyRole = async (role: string, message: string, agreementId: string) => {
    const users = await prisma.user.findMany({ where: { role: role as any } });
    if (users.length === 0) return;

    await prisma.notification.createMany({
        data: users.map(u => ({
            userId: u.id,
            agreementId,
            message,
        }))
    });
};

const notifyUser = async (userId: string, message: string, agreementId: string) => {
    await prisma.notification.create({
        data: {
            userId,
            agreementId,
            message,
        }
    });
};

const clearRoleNotifications = async (role: string, agreementId: string) => {
    const users = await prisma.user.findMany({ where: { role: role as any } });
    const userIds = users.map(u => u.id);

    await prisma.notification.deleteMany({
        where: {
            agreementId,
            userId: { in: userIds }
        }
    });
};

// Create Agreement
export const createAgreement = async (req: AuthRequest, res: Response) => {
    const { title, type, parties, value, duration, caseId } = req.body;
    const userId = req.user!.userId;
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
                existingCase = await prisma.case.findUnique({ where: { id: cleanCaseId } });
            } else {
                // If not UUID, assume it's a Reference Number (e.g., CASE-2024-001)
                existingCase = await prisma.case.findUnique({ where: { referenceNumber: cleanCaseId } });
            }

            if (!existingCase) {
                return res.status(400).json({ message: `Case not found with identifier: '${cleanCaseId}'. Please key in a valid Case ID or Reference Number.` });
            }
            resolvedCaseId = existingCase.id;
        }

        let parsedValue: number | null = null;
        if (value && value !== 'null' && value !== 'undefined') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                parsedValue = parsed;
            }
        }

        const agreement = await prisma.agreement.create({
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

        await logAction(agreement.id, userId, 'CREATED', 'Agreement created with initial draft');

        // Notify Creator
        // await notifyUser(userId, `Agreement "${agreement.title}" created successfully.`, agreement.id);

        // If we decided to auto-submit or just notify admins of new draft (optional, user didn't ask for this specifically for DRAFT)
        // keeping it simple as per request: "if a user created and summited..." -> implies submit action. 
        // asking for "in each stage, user who creates ... should get notification"
        // So let's notify them it is created.
        await notifyUser(userId, `You created agreement: ${agreement.title}`, agreement.id);

        res.status(201).json(agreement);
    } catch (error: any) {
        console.error('Error creating agreement:', error);
        res.status(500).json({ message: 'Error creating agreement', error: error.message || error });
    }
};

// Get Agreements
export const getAgreements = async (req: AuthRequest, res: Response) => {
    try {
        const agreements = await prisma.agreement.findMany({
            include: {
                createdBy: { select: { name: true, email: true } },
                versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
                case: { select: { referenceNumber: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(agreements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agreements', error });
    }
};

// Get Single Agreement Details
export const getAgreementById = async (req: AuthRequest, res: Response) => {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (!id) return res.status(400).json({ message: 'Invalid ID' });

    try {
        const agreement = await prisma.agreement.findUnique({
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
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agreement details', error });
    }
};

// Upload New Version
export const uploadVersion = async (req: AuthRequest, res: Response) => {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (!id) return res.status(400).json({ message: 'Invalid ID' });

    const { changeLog, parties, value, duration, type } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'Document file is required' });
    }

    try {
        const agreement = await prisma.agreement.findUnique({ where: { id }, include: { versions: true } });
        if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

        // Parse optional numeric value
        let parsedValue: number | null = null;
        if (value && value !== 'null' && value !== 'undefined' && value !== '') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                parsedValue = parsed;
            }
        }

        // Parse parties if string
        const parsedParties = (parties && typeof parties === 'string')
            ? parties.split(',').map((p: string) => p.trim()).filter((p: string) => p !== '')
            : agreement.parties; // Keep existing if not provided

        const newVersionNumber = agreement.versions.length + 1;

        // Transaction to ensure atomicity
        const [version, updatedAgreement] = await prisma.$transaction([
            prisma.agreementVersion.create({
                data: {
                    agreementId: id,
                    versionNumber: newVersionNumber,
                    filePath: file.path,
                    uploadedById: userId,
                    changeLog,
                },
            }),
            prisma.agreement.update({
                where: { id },
                data: {
                    status: 'PENDING_REVIEW', // Reset status on new version
                    parties: (parsedParties || agreement.parties) as any,
                    value: parsedValue !== null ? parsedValue : agreement.value,
                    duration: duration || agreement.duration,
                    type: type || agreement.type
                }
            })
        ]);

        await logAction(id, userId, 'REVISED', `Uploaded version ${newVersionNumber} with metadata updates`);

        // Notify Reviewers of new version
        await notifyRole('REVIEWER', `New version uploaded for ${agreement.title}`, id);
        // Notify Creator
        await notifyUser(agreement.createdById, `New version uploaded for your agreement: ${agreement.title}`, id);

        res.status(201).json(version);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading version', error });
    }
};

// Add Comment
export const addComment = async (req: AuthRequest, res: Response) => {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (!id) return res.status(400).json({ message: 'Invalid ID' });

    const { content } = req.body;
    const userId = req.user!.userId;

    try {
        const comment = await prisma.comment.create({
            data: {
                agreementId: id,
                userId,
                content,
            },
        });

        await logAction(id, userId, 'COMMENTED');

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
};

// Change Status (Submit, Approve, Reject)
export const updateStatus = async (req: AuthRequest, res: Response) => {
    // const id = getId(req.params.id);
    const id = getId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (!id) return res.status(400).json({ message: 'Invalid ID' });

    const { status, remarks } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    try {
        const agreement = await prisma.agreement.findUnique({ where: { id } });
        if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

        let newStatus: AgreementStatus = agreement.status;
        let actionType = '';

        if (status === 'SUBMIT' && agreement.status === 'DRAFT') {
            newStatus = 'PENDING_REVIEW';
            actionType = 'SUBMITTED';

            // Notify Reviewers
            await notifyRole('REVIEWER', `Agreement submitted for review: ${agreement.title}`, id);
            // Notify Creator
            await notifyUser(agreement.createdById, `You submitted ${agreement.title} for review`, id);

        } else if (status === 'APPROVE') {
            if (userRole === 'REVIEWER' && agreement.status === 'PENDING_REVIEW') {
                newStatus = 'PENDING_APPROVAL';
                actionType = 'REVIEWED & APPROVED';

                // Notify Approvers
                await notifyRole('APPROVER', `Agreement pending approval: ${agreement.title}`, id);
                // Notify Creator
                await notifyUser(agreement.createdById, `Your agreement ${agreement.title} was reviewed and approved by reviewer`, id);
                // Clear Reviewer Notifications
                await clearRoleNotifications('REVIEWER', id);

            } else if (userRole === 'APPROVER' && agreement.status === 'PENDING_APPROVAL') {
                newStatus = 'APPROVED';
                actionType = 'APPROVED';

                // Notify CLO
                await notifyRole('CLO', `Agreement approved and ready for execution: ${agreement.title}`, id);
                // Notify Creator
                await notifyUser(agreement.createdById, `Your agreement ${agreement.title} was approved`, id);
                // Clear Approver Notifications
                await clearRoleNotifications('APPROVER', id);

            } else {
                return res.status(403).json({ message: 'Invalid status transition for this role' });
            }
        } else if (status === 'REJECT') {
            newStatus = 'REJECTED';
            actionType = 'REJECTED';

            // Notify Creator
            await notifyUser(agreement.createdById, `Your agreement ${agreement.title} was rejected`, id);
            // Clear current role notifications (if Reviewer rejected, clear Reviewer tasks)
            await clearRoleNotifications(userRole, id);

        } else if (status === 'REQUEST_CHANGE') {
            newStatus = 'REVISION_REQUIRED';
            actionType = 'CHANGE REQUESTED';

            // Notify Creator
            await notifyUser(agreement.createdById, `Change requested for ${agreement.title}`, id);
            // Clear current role notifications
            await clearRoleNotifications(userRole, id);

        } else if (status === 'EXECUTED') {
            if (userRole === 'CLO' && agreement.status === 'APPROVED') {
                newStatus = 'EXECUTED';
                actionType = 'EXECUTED';

                // Notify Creator
                await notifyUser(agreement.createdById, `Your agreement ${agreement.title} has been executed`, id);
                // Clear CLO Notifications
                await clearRoleNotifications('CLO', id);
            } else {
                return res.status(403).json({ message: 'Only CLO can execute approved agreements' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid status action' });
        }

        await prisma.agreement.update({
            where: { id },
            data: { status: newStatus }
        });

        await logAction(id, userId, actionType, remarks);

        res.json({ message: `Agreement status updated to ${newStatus}`, status: newStatus });

    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
};

// Get Dashboard Stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await prisma.agreement.groupBy({
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
            } else if (s.status === 'PENDING_REVIEW' || s.status === 'PENDING_APPROVAL') {
                formattedStats.pending += count;
            } else if (s.status === 'APPROVED') {
                formattedStats.approved += count;
            } else if (s.status === 'REJECTED') {
                formattedStats.rejected += count;
            }
        });

        const recentActivity = await prisma.actionLog.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

// Get Notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

// Mark Notification Read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
    const id = getId(req.params.id as string);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};

// Delete Agreement (Admin only)
export const deleteAgreement = async (req: AuthRequest, res: Response) => {
    try {
        const id = getId(req.params.id as string);
        if (!id) return res.status(400).json({ message: 'Invalid ID' });

        const userRole = (req as any).user.role;

        if (userRole !== 'ADMIN') {
            res.status(403).json({ message: 'Only administrators can delete agreements' });
            return;
        }

        const agreement = await prisma.agreement.findUnique({ where: { id } });
        if (!agreement) {
            res.status(404).json({ message: 'Agreement not found' });
            return;
        }

        await prisma.agreement.delete({
            where: { id }
        });

        res.json({ message: 'Agreement deleted successfully' });
    } catch (error) {
        console.error('Delete agreement error:', error);
        res.status(500).json({ message: 'Failed to delete agreement' });
    }
};
