import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, Empty, inputBase, PageHeader } from "@/components/ui";
import { ArtUploader } from "./art-uploader";
import { deleteArt, toggleArt, updateArt } from "./actions";

export const dynamic = "force-dynamic";

export default async function ArtPage() {
  await requireUser("ADMIN");
  const art = await db.artwork.findMany({ orderBy: [{ artist: "asc" }, { title: "asc" }] });
  const showing = art.filter((a) => a.active).length;
  return (
    <>
      <PageHeader title="TV paintings" back="/more" />
      <Card className="mb-6">
        <p className="mb-3 text-sm text-slate-600">
          The office TV shows one of these across the top of the board and changes every hour. {showing} of {art.length} in rotation.
        </p>
        <ArtUploader />
      </Card>
      {art.length === 0 ? <Empty>No paintings yet.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {art.map((a) => (
            <Card key={a.id} className={`p-2 ${a.active ? "" : "opacity-50"}`}>
              <img src={`/tv/art/${a.id}`} alt={a.title} loading="lazy" className="aspect-[2/1] w-full rounded-lg object-cover" />
              <form action={updateArt.bind(null, a.id)} className="mt-2 flex flex-col gap-1">
                <input name="title" defaultValue={a.title} aria-label="Title" className={`${inputBase} py-1 text-sm`} />
                <div className="flex gap-1">
                  <input name="artist" defaultValue={a.artist ?? ""} placeholder="Artist" aria-label="Artist" className={`${inputBase} min-w-0 flex-1 py-1 text-sm`} />
                  <button className="rounded-lg px-2 text-sm text-brand-700">Save</button>
                </div>
              </form>
              {a.credit && <p className="mt-1 truncate text-xs text-slate-500">{a.credit}</p>}
              <div className="mt-1 flex justify-between text-sm">
                <form action={toggleArt.bind(null, a.id)}><button className="text-slate-600 underline">{a.active ? "Hide from TV" : "Show on TV"}</button></form>
                <form action={deleteArt.bind(null, a.id)}><ConfirmButton className="text-red-700 underline" message={`Delete ${a.title}?`}>Delete</ConfirmButton></form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
