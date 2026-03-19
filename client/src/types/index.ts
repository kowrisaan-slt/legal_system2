export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER' | 'REVIEWER' | 'CLO' | 'SUPERVISOR' | 'LO' | 'APPROVER';
    department?: string;
}

export interface Agreement {
    id: string;
    title: string;
    type: string;
    parties: string[];
    value: number | null;
    duration: string | null;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'REVISION_REQUIRED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'ARCHIVED';
    caseId: string | null;
    createdById: string;
    createdBy?: User;
    createdAt: string;
    updatedAt: string;
    expiryDate: string | null;
    versions?: AgreementVersion[];
    comments?: Comment[];
    actions?: ActionLog[];
}

export interface AgreementVersion {
    id: string;
    agreementId: string;
    versionNumber: number;
    filePath: string;
    uploadedById: string | null;
    uploadedBy?: User;
    changeLog: string | null;
    createdAt: string;
}

export interface Comment {
    id: string;
    agreementId: string;
    userId: string;
    user?: User;
    content: string;
    createdAt: string;
}

export interface ActionLog {
    id: string;
    agreementId: string;
    userId: string;
    user?: User;
    action: string;
    details: string | null;
    timestamp: string;
}
