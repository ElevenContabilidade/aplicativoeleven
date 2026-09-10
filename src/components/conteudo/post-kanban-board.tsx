"use client";

import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { ConteudoPost, ConteudoStatus } from "@/lib/types";
import { CONTEUDO_STATUS } from "@/lib/types";
import { PostCard } from "./post-card";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

function Column({
  status,
  posts,
  onOpen,
}: {
  status: ConteudoStatus;
  posts: ConteudoPost[];
  onOpen: (post: ConteudoPost) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-80 shrink-0 flex-col rounded-2xl border border-sand-200 bg-sand-100/60 p-2.5 transition-colors",
        isOver && "border-wine-400 bg-wine-50"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-sand-700">{status}</p>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-sand-500">{posts.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onOpen={() => onOpen(post)} />
        ))}
        {posts.length === 0 && <p className="px-2 py-6 text-center text-[11px] text-sand-400">Nenhum post aqui</p>}
      </div>
    </div>
  );
}

export function PostKanbanBoard({ posts, onOpen }: { posts: ConteudoPost[]; onOpen: (post: ConteudoPost) => void }) {
  const updateConteudoPost = useAppStore((s) => s.updateConteudoPost);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const status = e.over?.id as ConteudoStatus | undefined;
    const postId = e.active.id as string;
    if (!status || !CONTEUDO_STATUS.includes(status)) return;
    const post = posts.find((p) => p.id === postId);
    if (!post || post.status === status) return;
    updateConteudoPost(postId, { status });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        {CONTEUDO_STATUS.map((status) => (
          <Column key={status} status={status} posts={posts.filter((p) => p.status === status)} onOpen={onOpen} />
        ))}
      </div>
    </DndContext>
  );
}
