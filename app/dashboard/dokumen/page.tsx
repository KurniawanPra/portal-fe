'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import {
  DocumentPageHeader,
  DocumentPanel,
  LoadingButton,
  inputClass,
} from './_components/DocumentUi';
import { CustomCategorySelect } from './_components/CustomCategorySelect';
import { DocumentFolderTree } from './_components/DocumentFolderTree';
import { DocumentUploadModal } from './_components/DocumentUploadModal';
import { DocumentViewModal } from './_components/DocumentViewModal';
import { DocumentDownloadModal } from './_components/DocumentDownloadModal';
import { useDocumentToast } from './_components/useDocumentToast';
import { errorMessage } from './_lib/document-api';
import type {
  DocumentCapabilities,
  DocumentCategory,
  DocumentRow,
  DocumentTreeResponse,
  DownloadRequest,
  UnitOption,
} from './_lib/types';

const emptyTree: DocumentTreeResponse = {
  roots: [],
  generalDocuments: [],
  totals: { folders: 0, documents: 0, categories: 0 },
};

function findDocumentInTree(nodes: DocumentTreeResponse['roots'], documentId: string): DocumentRow | null {
  for (const node of nodes) {
    const document = node.documents.find(item => item.id === documentId);
    if (document) return document;
    const nested = findDocumentInTree(node.children, documentId);
    if (nested) return nested;
  }
  return null;
}

export default function DocumentsPage() {
  const router = useRouter();
  const notice = useDocumentToast();
  const [tree, setTree] = useState<DocumentTreeResponse>(emptyTree);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [capabilities, setCapabilities] = useState<DocumentCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadUnitId, setUploadUnitId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Download modal state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedDownloadDoc, setSelectedDownloadDoc] = useState<DocumentRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    Promise.all([
      api.get<DocumentCapabilities>('/documents/capabilities'),
      api.get<DocumentCategory[]>('/documents/categories'),
      api.get<UnitOption[]>('/org/unit?limit=1000'),
    ])
      .then(([capabilityResponse, categoryResponse, unitResponse]) => {
        setCapabilities(capabilityResponse.data);
        setCategories(categoryResponse.data);
        setUnits(unitResponse.data);
      })
      .catch(error => notice.error(errorMessage(error)));
    // Reference data only needs to be bootstrapped once per page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [myRequests, setMyRequests] = useState<DownloadRequest[]>([]);

  const myRequestsMap = useMemo(() => {
    const map = new Map<string, DownloadRequest>();
    for (const req of myRequests) {
      if (!map.has(req.documentId)) {
        map.set(req.documentId, req);
      }
    }
    return map;
  }, [myRequests]);

  const loadTree = async () => {
    if (!capabilities) return;
    setLoading(true);
    const params = new URLSearchParams({ scope: capabilities.canManage ? 'manage' : 'accessible' });
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    try {
      const [treeRes, reqRes] = await Promise.all([
        api.get<DocumentTreeResponse>(`/documents/tree?${params}`),
        api.get<{ rows: DownloadRequest[] } | DownloadRequest[]>('/documents/download-requests/mine?limit=200').catch(() => ({ data: [] })),
      ]);
      setTree(treeRes.data);
      const rawRequests = reqRes.data;
      const listData = Array.isArray(rawRequests)
        ? rawRequests
        : (Array.isArray((rawRequests as any)?.rows) ? (rawRequests as any).rows : []);
      setMyRequests(listData);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTree();
  }, [capabilities, search, categoryId]);

  const handleUploadToUnit = (unitId: string, file?: File) => {
    setUploadUnitId(unitId);
    setUploadFile(file || null);
    setUploadOpen(true);
  };

  const handleViewDocument = (doc: DocumentRow) => {
    setSelectedDocId(doc.id);
    setViewModalOpen(true);
  };

  const handleOpenDownloadModal = (doc: DocumentRow) => {
    setViewModalOpen(false);
    setSelectedDocId(null);
    setSelectedDownloadDoc(doc);
    setDownloadModalOpen(true);
  };

  const handleDownloadDocument = async (doc: DocumentRow) => {
    const req = myRequestsMap.get(doc.id);
    if (req?.status === 'approved' && req.downloadToken) {
      router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(doc.id)}`);
    } else if (req?.status === 'pending') {
      notice.info('Pengajuan unduh dokumen ini sedang menunggu persetujuan administrator.');
    } else {
      handleOpenDownloadModal(doc);
    }
  };

  const handleConfirmDownload = async (reason: string, watermarkStyle: string) => {
    if (!selectedDownloadDoc) return;
    try {
      const response = await api.post<{
        requestId: string;
        status: string;
        downloadToken: string | null;
        tokenExpiresAt: string | null;
      }>(`/documents/${selectedDownloadDoc.id}/download-request`, { reason });

      if (response.data.downloadToken) {
        router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(selectedDownloadDoc.id)}`);
      } else {
        notice.success('Permintaan unduh dokumen berhasil dikirim kepada administrator.');
        setMyRequests(prev => [
          {
            id: response.data.requestId,
            documentId: selectedDownloadDoc.id,
            documentTitle: selectedDownloadDoc.title,
            categoryName: selectedDownloadDoc.categoryName,
            status: 'pending',
            reason,
            createdAt: new Date().toISOString(),
          },
          ...prev.filter(item => item.documentId !== selectedDownloadDoc.id),
        ]);
        window.dispatchEvent(new Event('document-approvals-changed'));
      }
      await loadTree();
    } catch (error) {
      notice.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />
      <DocumentPageHeader
        title="Daftar Dokumen"
        description="Dokumen disusun mengikuti hierarki unit organisasi dan hak akses akun Anda."
        action={
          capabilities?.canManage ? (
            <LoadingButton
              onClick={() => {
                setUploadUnitId('');
                setUploadFile(null);
                setUploadOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Upload Baru
            </LoadingButton>
          ) : undefined
        }
      />

      <DocumentPanel>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-9`}
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder="Cari dokumen..."
            />
          </div>
          <div className="sm:w-64 shrink-0">
            <CustomCategorySelect
              value={categoryId}
              onChange={setCategoryId}
              categories={categories}
            />
          </div>
        </div>

        <DocumentFolderTree
          tree={tree}
          loading={loading}
          filtering={Boolean(search || categoryId)}
          userRequestsMap={myRequestsMap}
          onUploadToUnit={handleUploadToUnit}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
        />
      </DocumentPanel>

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploadUnitId('');
          setUploadFile(null);
        }}
        categories={categories}
        units={units}
        initialUnitId={uploadUnitId}
        initialFile={uploadFile}
        onUploaded={() => {
          notice.success('Dokumen berhasil diunggah.');
          loadTree();
        }}
        onError={notice.error}
      />

      <DocumentViewModal
        open={viewModalOpen}
        documentId={selectedDocId}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedDocId(null);
        }}
        onDownload={(docId, title) => {
          const docRow = findDocumentInTree(tree.roots, docId)
            || tree.generalDocuments.find(document => document.id === docId)
            || { id: docId, title } as DocumentRow;
          handleOpenDownloadModal(docRow);
        }}
      />

      {selectedDownloadDoc && (
        <DocumentDownloadModal
          open={downloadModalOpen}
          documentId={selectedDownloadDoc.id}
          documentTitle={selectedDownloadDoc.title}
          categoryName={selectedDownloadDoc.categoryName}
          version={selectedDownloadDoc.version}
          fileSize={selectedDownloadDoc.fileSize}
          mimeType={selectedDownloadDoc.mimeType}
          onClose={() => {
            setDownloadModalOpen(false);
            setSelectedDownloadDoc(null);
          }}
          onConfirmDownload={handleConfirmDownload}
        />
      )}
    </div>
  );
}
