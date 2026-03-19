import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, department } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role, // Expecting valid Enum value from frontend
                department, // Added department
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getLegalOfficers = async (req: Request, res: Response): Promise<void> => {
    try {
        const legalOfficers = await prisma.user.findMany({
            where: { role: 'LO' },
            select: { id: true, name: true, email: true }
        });
        res.json(legalOfficers);
    } catch (error) {
        console.error('Get LOs error:', error);
        res.status(500).json({ message: 'Failed to fetch Legal Officers' });
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, department: true }
        });
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const userRole = (req as any).user.role;

        if (userRole !== 'ADMIN') {
            res.status(403).json({ message: 'Only Admins can delete users' });
            return;
        }

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Failed to delete user', error: error.message || error });
    }
};
