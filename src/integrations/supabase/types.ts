export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          restaurant_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          restaurant_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          restaurant_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          flags: Json
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          flags?: Json
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          flags?: Json
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          menu_item_id: string
          position: number
          restaurant_id: string
          storage_path: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          menu_item_id: string
          position?: number
          restaurant_id: string
          storage_path: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          menu_item_id?: string
          position?: number
          restaurant_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_images_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_images_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: Database["public"]["Enums"]["allergen"][]
          calories: number | null
          category_id: string | null
          created_at: string
          description: string | null
          i18n: Json
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          position: number
          price_cents: number
          restaurant_id: string
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          allergens?: Database["public"]["Enums"]["allergen"][]
          calories?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          i18n?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          position?: number
          price_cents?: number
          restaurant_id: string
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          allergens?: Database["public"]["Enums"]["allergen"][]
          calories?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          i18n?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          position?: number
          price_cents?: number
          restaurant_id?: string
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          closes: string | null
          created_at: string
          id: string
          is_closed: boolean
          opens: string | null
          restaurant_id: string
          weekday: number
        }
        Insert: {
          closes?: string | null
          created_at?: string
          id?: string
          is_closed?: boolean
          opens?: string | null
          restaurant_id: string
          weekday: number
        }
        Update: {
          closes?: string | null
          created_at?: string
          id?: string
          is_closed?: boolean
          opens?: string | null
          restaurant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          body: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          position: number
          restaurant_id: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          restaurant_id: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          restaurant_id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          party_size: number
          phone: string | null
          restaurant_id: string
          slot_at: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          party_size: number
          phone?: string | null
          restaurant_id: string
          slot_at: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          party_size?: number
          phone?: string | null
          restaurant_id?: string
          slot_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          locale: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          tagline: string | null
          theme: Json
          updated_at: string
        }
        Insert: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          tagline?: string | null
          theme?: Json
          updated_at?: string
        }
        Update: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          tagline?: string | null
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author: string
          body: string | null
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          restaurant_id: string
        }
        Insert: {
          author: string
          body?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          restaurant_id: string
        }
        Update: {
          author?: string
          body?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          position: number
          restaurant_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          position?: number
          restaurant_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          position?: number
          restaurant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of: { Args: { _restaurant_id: string }; Returns: boolean }
      is_member_with_role: {
        Args: {
          _restaurant_id: string
          _roles: Database["public"]["Enums"]["member_role"][]
        }
        Returns: boolean
      }
    }
    Enums: {
      allergen:
        | "gluten"
        | "lactose"
        | "nuts"
        | "egg"
        | "fish"
        | "shellfish"
        | "soy"
        | "sesame"
        | "celery"
        | "mustard"
        | "sulphites"
        | "lupin"
        | "molluscs"
        | "peanuts"
      app_role: "owner" | "admin" | "staff"
      member_role: "owner" | "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      allergen: [
        "gluten",
        "lactose",
        "nuts",
        "egg",
        "fish",
        "shellfish",
        "soy",
        "sesame",
        "celery",
        "mustard",
        "sulphites",
        "lupin",
        "molluscs",
        "peanuts",
      ],
      app_role: ["owner", "admin", "staff"],
      member_role: ["owner", "admin", "staff"],
    },
  },
} as const
