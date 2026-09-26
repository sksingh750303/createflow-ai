"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createProject as fsCreateProject,
  deleteGeneration as fsDeleteGeneration,
  deleteProject as fsDeleteProject,
  duplicateProject as fsDuplicateProject,
  getBrandKit,
  markAllNotificationsRead as fsMarkAllNotificationsRead,
  markNotificationRead as fsMarkNotificationRead,
  saveBrandKit as fsSaveBrandKit,
  subscribeGenerations,
  subscribeNotifications,
  subscribeProjects,
  updateProject as fsUpdateProject,
} from "@/lib/firebase/firestore";
import { BrandKit, Generation, GenerationType, Notification, Project } from "@/types";

export function useProjects() {
  const { firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeProjects(firebaseUser.uid, (p) => {
      setProjects(p);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseUser]);

  return {
    projects,
    loading,
    createProject: (data: { name: string; type: GenerationType; status?: Project["status"]; content?: string }) =>
      firebaseUser ? fsCreateProject(firebaseUser.uid, data) : Promise.reject(new Error("Not signed in")),
    updateProject: fsUpdateProject,
    deleteProject: fsDeleteProject,
    duplicateProject: (project: Project) =>
      firebaseUser ? fsDuplicateProject(firebaseUser.uid, project) : Promise.reject(new Error("Not signed in")),
  };
}

export function useHistory(limitCount = 50) {
  const { firebaseUser } = useAuth();
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeGenerations(
      firebaseUser.uid,
      (g) => {
        setHistory(g);
        setLoading(false);
      },
      limitCount
    );
    return unsubscribe;
  }, [firebaseUser, limitCount]);

  return { history, loading, deleteGeneration: fsDeleteGeneration };
}

export function useNotifications() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      return;
    }
    const unsubscribe = subscribeNotifications(firebaseUser.uid, setNotifications);
    return unsubscribe;
  }, [firebaseUser]);

  return {
    notifications,
    markRead: fsMarkNotificationRead,
    markAllRead: () =>
      firebaseUser
        ? fsMarkAllNotificationsRead(
            firebaseUser.uid,
            notifications.filter((n) => !n.read).map((n) => n.id)
          )
        : Promise.resolve(),
  };
}

export function useBrandKit() {
  const { firebaseUser } = useAuth();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setBrandKit(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBrandKit(firebaseUser.uid)
      .then(setBrandKit)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  return {
    brandKit,
    loading,
    saveBrandKit: (kit: BrandKit) =>
      firebaseUser ? fsSaveBrandKit(firebaseUser.uid, kit) : Promise.reject(new Error("Not signed in")),
  };
}
