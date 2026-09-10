"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar, ImageIcon, Link as LinkIcon } from "lucide-react";
import type { ConteudoPost } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatDate } from "@/lib/utils";

export function PostCard({ post, onOpen }: { post: ConteudoPost; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={cn(
        "cursor-grab rounded-xl border border-sand-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <p className="text-sm font-semibold text-sand-900">{post.tema}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        <StatusBadge status={post.formato} />
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-sand-100 pt-2 text-[11px] text-sand-500">
        <span className="flex items-center gap-1">
          <Calendar className="size-3" /> {formatDate(post.data)}
        </span>
        <span className="flex items-center gap-2">
          {post.linkDocumento && <LinkIcon className="size-3" />}
          {post.imagens.length > 0 && (
            <span className="flex items-center gap-0.5">
              <ImageIcon className="size-3" /> {post.imagens.length}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
