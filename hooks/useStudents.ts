"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StudentRow } from "@/types/database";
import { sortByLastName } from "@/lib/utils/sort-students";

export function useStudents(classId: string | null | undefined) {
  return useQuery({
    queryKey: ["students", classId],
    enabled: Boolean(classId),
    queryFn: async (): Promise<StudentRow[]> => {
      if (!classId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId);
      if (error) throw error;
      return sortByLastName(data ?? []);
    },
  });
}
