export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string;
          name: string;
          subject: string | null;
          teacher_id: string | null;
          created_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          initials: string | null;
          avatar_url: string | null;
          language: string | null;
          performance_score: number | null;
          is_absent: boolean | null;
          class_id: string | null;
          created_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type StudentRow = Database["public"]["Tables"]["students"]["Row"];
export type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
