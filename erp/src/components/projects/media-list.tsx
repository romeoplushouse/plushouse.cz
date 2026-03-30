"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Camera, Video, Image } from "lucide-react";
import { addMediaEvidence } from "@/lib/actions/projects";

type MediaItem = {
  id: string;
  type: string;
  phase: string | null;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  uploadedAt: Date | string;
};

const phaseLabels: Record<string, string> = {
  BEFORE: "P\u0159ed",
  DURING: "B\u011bhem",
  AFTER: "Po",
};

export function MediaList({
  projectId,
  media,
}: {
  projectId: string;
  media: MediaItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  async function handleAdd(formData: FormData) {
    const url = formData.get("url") as string;
    if (!url?.trim()) return;

    startTransition(async () => {
      await addMediaEvidence(projectId, {
        type: (formData.get("type") as "PHOTO" | "VIDEO") || "PHOTO",
        phase: (formData.get("phase") as string) || undefined,
        url: url.trim(),
        thumbnailUrl: (formData.get("thumbnailUrl") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Fotodokumentace ({media.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          P\u0159idat z\u00e1znam
        </Button>
      </div>

      {showForm && (
        <form
          action={handleAdd}
          className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Typ</label>
              <select
                name="type"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PHOTO">Fotografie</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                F\u00e1ze
              </label>
              <select
                name="phase"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Nespecifikov\u00e1no --</option>
                <option value="BEFORE">P\u0159ed</option>
                <option value="DURING">B\u011bhem</option>
                <option value="AFTER">Po</option>
              </select>
            </div>
          </div>
          <Input name="url" placeholder="URL souboru *" required />
          <Input name="thumbnailUrl" placeholder="URL n\u00e1hledu (voliteln\u00e9)" />
          <textarea
            name="description"
            rows={2}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Popis..."
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Ulo\u017eit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Zru\u0161it
            </Button>
          </div>
        </form>
      )}

      {media.length === 0 ? (
        <div className="text-center py-6">
          <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Zat\u00edm \u017e\u00e1dn\u00e1 fotodokumentace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden group"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                {item.thumbnailUrl || item.type === "PHOTO" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.description || ""}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (
                        e.target as HTMLImageElement
                      ).parentElement!.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                    }}
                  />
                ) : null}
                {item.type === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                )}
                {item.type === "PHOTO" && !item.thumbnailUrl && (
                  <Camera className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.type === "PHOTO" ? "Foto" : "Video"}
                  </Badge>
                  {item.phase && (
                    <Badge variant="outline" className="text-xs">
                      {phaseLabels[item.phase] ?? item.phase}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-600 truncate">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.uploadedAt).toLocaleDateString("cs-CZ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
