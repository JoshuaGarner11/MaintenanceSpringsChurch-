// A printable half-letter sign for a room. Its QR opens the public report page.
export function ReportSign({ id, name, area }: { id: string; name: string; area?: string | null }) {
  return (
    <div data-fixed-theme className="flex w-[5.5in] max-w-full break-inside-avoid flex-col items-center rounded-2xl border-2 border-slate-800 bg-white p-6 text-center print:mb-[0.5in]">
      <div className="text-2xl font-bold">Something not right?</div>
      <div className="mt-1 text-slate-700">Out of supplies, a leak, something broken…</div>
      <img src={`/qr?path=/report/${id}`} alt="QR code to report a problem" className="my-4 h-56 w-56" />
      <div className="text-lg font-semibold">Scan with your phone camera to let us know</div>
      <div className="mt-3 text-sm text-slate-600">{area ? `${area} › ` : ""}{name}</div>
      <div className="text-xs text-slate-500">The Springs Church · Building team</div>
    </div>
  );
}
