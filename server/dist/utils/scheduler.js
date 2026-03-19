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
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("./prisma"));
// Run every day at midnight
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Running expiry check...');
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    try {
        const expiringAgreements = yield prisma_1.default.agreement.findMany({
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
            yield prisma_1.default.notification.create({
                data: {
                    userId: agreement.createdById, // Notify creator (simplified)
                    message: `Agreement "${agreement.title}" is expiring on ${(_a = agreement.expiryDate) === null || _a === void 0 ? void 0 : _a.toDateString()}.`,
                },
            });
        }
    }
    catch (error) {
        console.error('Error running expiry check:', error);
    }
}));
