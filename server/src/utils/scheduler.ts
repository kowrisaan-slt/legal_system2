import cron from 'node-cron';
import prisma from './prisma';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running expiry check...');
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    try {
        const expiringAgreements = await prisma.agreement.findMany({
            where: {
                expiryDate: {
                    lte: sevenDaysFromNow,
                    gte: new Date(),
                },
                status: 'EXECUTED',
            },
        });

        for (const agreement of expiringAgreements) {
            // In a real app, send email here.
            // For now, create a notification in DB.
            console.log(`Agreement ${agreement.title} is expiring soon!`);

            await prisma.notification.create({
                data: {
                    userId: agreement.createdById, // Notify creator (simplified)
                    message: `Agreement "${agreement.title}" is expiring on ${agreement.expiryDate?.toDateString()}.`,
                },
            });
        }
    } catch (error) {
        console.error('Error running expiry check:', error);
    }
});
