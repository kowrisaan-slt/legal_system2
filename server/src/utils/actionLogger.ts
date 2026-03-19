import prisma from './prisma';

export const logAction = async (agreementId: string, userId: string, action: string, details?: string) => {
    try {
        await prisma.actionLog.create({
            data: {
                agreementId,
                userId,
                action,
                details,
            },
        });
    } catch (error) {
        console.error('Failed to log action:', error);
    }
};
