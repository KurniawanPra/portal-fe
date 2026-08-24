import { redirect } from 'next/navigation';

export default function MyUploadedDocumentsPage() {
  redirect('/dashboard/dokumen/approved');
}
