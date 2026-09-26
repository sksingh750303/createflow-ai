"use client";

import { useState } from "react";
import {
  Copy,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Megaphone,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Video,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useProjects } from "@/lib/hooks";
import { relativeTime } from "@/lib/utils";
import { toast } from "@/lib/toast-store";
import { GenerationType, Project } from "@/types";

const typeIcons: Record<GenerationType, typeof FileText> = {
  Writing: FileText,
  Images: ImageIcon,
  Video: Video,
  Social: Megaphone,
  SEO: TrendingUp,
};

export default function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject, duplicateProject } = useProjects();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<GenerationType>("Writing");
  const [renameValue, setRenameValue] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      toast("Enter a project name.", "error");
      return;
    }
    await createProject({ name, type, status: "draft" });
    toast("Project created", "success");
    setCreateOpen(false);
    setName("");
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    await updateProject(renameTarget.id, { name: renameValue });
    toast("Project renamed", "success");
    setRenameTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id);
    toast("Project deleted", "success");
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you&apos;re working on, in one place.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center justify-center p-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first project to get started.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const Icon = typeIcons[p.type];
            return (
              <Card key={p.id} className="relative p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                      className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Project actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === p.id && (
                      <div className="glass absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-border p-1 shadow-lg">
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            toast(`Opened "${p.name}"`);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          <FolderOpen className="h-3.5 w-3.5" /> Open
                        </button>
                        <button
                          onClick={() => {
                            setRenameTarget(p);
                            setRenameValue(p.name);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button
                          onClick={() => {
                            duplicateProject(p);
                            toast("Project duplicated", "success");
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(p);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 font-semibold">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.type} · Updated {relativeTime(p.updatedAt)}
                </p>
                <Badge
                  className="mt-3"
                  variant={p.status === "completed" ? "success" : p.status === "in-progress" ? "accent" : "default"}
                >
                  {p.status}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create project">
        <div className="space-y-4">
          <div>
            <Label htmlFor="proj-name">Project name</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Autumn campaign" />
          </div>
          <div>
            <Label htmlFor="proj-type">Type</Label>
            <Select id="proj-type" value={type} onChange={(e) => setType(e.target.value as GenerationType)}>
              <option value="Writing">Writing</option>
              <option value="Images">Images</option>
              <option value="Video">Video</option>
              <option value="Social">Social</option>
              <option value="SEO">SEO</option>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Create Project
          </Button>
        </div>
      </Modal>

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename project">
        <div className="space-y-4">
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <Button className="w-full" onClick={handleRename}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete project?"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
      >
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
