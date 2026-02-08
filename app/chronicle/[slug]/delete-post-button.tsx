"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2Icon } from "lucide-react";

export function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const key = searchParams.get("key");
  if (!key) return null;

  const handleDeleteClick = () => setOpen(true);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/chronicle/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Delete failed");
        return;
      }
      setOpen(false);
      toast.success("Post deleted");
      router.push("/chronicle");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
        onClick={handleDeleteClick}
      >
        <Trash2Icon className="size-4" />
        Delete post
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => deleting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2Icon className="size-4" />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
