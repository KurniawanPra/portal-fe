export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRow {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  title: string;
  description: string | null;
  fileSize: number;
  mimeType: string;
  ownerUnitId: string | null;
  ownerUnitName: string | null;
  uploadedBy: string;
  uploadedByName: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTargetUnit {
  unitId: string;
  unitName: string;
  unitKode?: string;
}

export interface DocumentDetail extends DocumentRow {
  targetUnits?: DocumentTargetUnit[];
  includeDescendants?: boolean;
  access: {
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
    canApproveRule: boolean;
  };
}

export interface DocumentCapabilities {
  canManage: boolean;
  canApproveDownload: boolean;
  canViewAudit: boolean;
  pendingApprovalCount: number;
  myPendingCount?: number;
  myApprovedCount?: number;
}

export interface UnitOption {
  id: string;
  nama: string;
  kode: string;
  parentId: string | null;
  tipe?: string;
}

export interface DocumentTreeNode extends UnitOption {
  tipe: string;
  documents: DocumentRow[];
  children: DocumentTreeNode[];
  documentCount: number;
}

export interface DocumentTreeResponse {
  roots: DocumentTreeNode[];
  generalDocuments: DocumentRow[];
  totals: {
    folders: number;
    documents: number;
    categories: number;
  };
}

export interface GradeOption {
  id: string;
  kode: string;
  nama: string;
  label?: string;
  level: number;
}

export interface EmployeeOption {
  id: string;
  nama: string;
  nrk: string;
  jabatan?: string;
}

export interface AccessRule {
  id: string;
  documentId: string | null;
  documentTitle: string | null;
  documentCategoryId: string | null;
  categoryName: string | null;
  unitOrganisasiId: string | null;
  unitName: string | null;
  includeDescendants: boolean;
  minGradeLevel: number | null;
  minGradeCode: string | null;
  accessType: 'view' | 'edit' | 'approve';
  createdAt: string;
}

export interface DocumentApprover {
  id: string;
  documentCategoryId: string | null;
  categoryName: string | null;
  unitOrganisasiId: string | null;
  unitName: string | null;
  employeeId: string;
  employeeName: string;
  employeeNrk: string;
  approvalOrder: number;
  createdAt: string;
}

export type DownloadStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'used';

export interface DownloadRequest {
  id: string;
  documentId: string;
  documentTitle: string;
  categoryName: string;
  ownerUnitName?: string | null;
  requestedBy?: string;
  requesterName?: string;
  requesterNrk?: string;
  approverName?: string | null;
  status: DownloadStatus;
  reason: string | null;
  rejectionReason?: string | null;
  downloadToken?: string | null;
  tokenExpiresAt?: string | null;
  downloadedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DownloadAccessStatus {
  canView: boolean;
  request: null | Pick<DownloadRequest, 'id' | 'status' | 'reason' | 'rejectionReason' | 'downloadToken' | 'tokenExpiresAt' | 'downloadedAt' | 'createdAt' | 'updatedAt'>;
}

export interface DocumentAudit {
  id: string;
  documentId: string;
  documentTitle: string;
  employeeId: string;
  employeeName: string;
  employeeNrk: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  fileSize: number;
  mimeType: string;
  changelog: string | null;
  uploadedBy: string;
  uploadedByName: string | null;
  createdAt: string;
}
