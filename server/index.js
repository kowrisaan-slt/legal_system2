"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const agreementRoutes_1 = __importDefault(require("./routes/agreementRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const caseRoutes_1 = __importDefault(require("./routes/caseRoutes"));
require("./utils/scheduler"); // Start scheduler
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/agreements', agreementRoutes_1.default);
app.use('/users', userRoutes_1.default);
app.use('/cases', caseRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Agreement Approval Management API is running');
});
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
    console.log("Server running...");
});