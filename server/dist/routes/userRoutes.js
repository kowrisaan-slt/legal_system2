"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User Management (Admin only)
router.post('/', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['ADMIN']), userController_1.createUser);
router.get('/', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['ADMIN']), userController_1.getAllUsers);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['ADMIN']), userController_1.deleteUser);
// Get Legal Officers (For Supervisors to assign cases)
router.get('/legal-officers', auth_1.authenticateToken, (0, auth_1.authorizeRoles)(['SUPERVISOR', 'CLO', 'ADMIN']), userController_1.getLegalOfficers);
exports.default = router;
