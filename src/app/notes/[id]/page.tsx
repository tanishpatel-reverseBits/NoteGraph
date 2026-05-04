import { NoteDetailClient } from "@/components/notes/note-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <NoteDetailClient noteId={id} />;
}
