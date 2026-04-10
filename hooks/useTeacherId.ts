"use client";

import { useState, useEffect } from "react";
import { Teacher } from "@/lib/types";

const STORAGE_KEY = "homework_teacher_id";

/**
 * Hook to get/set the current teacher for homework tracking.
 * Persists selection in localStorage. Fetches teacher list on mount.
 * Returns null until a teacher is selected.
 */
export function useTeacherId() {
  const [teacherId, setTeacherIdState] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTeacherIdState(stored);

    async function fetchTeachers() {
      try {
        const res = await fetch("/api/teachers?status=active");
        if (!res.ok) return;
        const json = await res.json();
        setTeachers(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  function setTeacherId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setTeacherIdState(id);
  }

  return { teacherId, setTeacherId, teachers, loading };
}
