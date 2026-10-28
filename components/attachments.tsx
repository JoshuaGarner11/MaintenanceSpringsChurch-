import type { Attachment } from "@prisma/client";
import { Empty } from "./ui";

export function Attachments({ files }: { files: Attachment[] }) {
  if (files.length === 0) return <Empty>No photos or files yet.</Empty>;
  const images = files.filter((f) => f.mimeType.startsWith("image/"));
  const docs = files.filter((f) => !f.mimeType.startsWith("image/"));
  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((f) => (
            <a key={f.id} href={`/files/${f.id}`} target="_blank" className="block aspect-square overflow-hidden rounded-lg bg-slate-200">
              <img src={`/files/${f.id}`} alt={f.fileName} loading="lazy" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}
      {docs.map((f) => (
        <a key={f.id} href={`/files/${f.id}`} target="_blank" className="block truncate rounded-lg bg-surface px-3 py-2 text-sm text-brand-700 ring-1 ring-slate-200">
          {f.fileName}
        </a>
      ))}
    </div>
  );
}
