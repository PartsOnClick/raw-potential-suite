export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          generated_content: string
          generation_cost: number | null
          id: string
          model_used: string
          product_id: string | null
          prompt_input: Json
          prompt_type: string
        }
        Insert: {
          created_at?: string
          generated_content: string
          generation_cost?: number | null
          id?: string
          model_used: string
          product_id?: string | null
          prompt_input: Json
          prompt_type: string
        }
        Update: {
          created_at?: string
          generated_content?: string
          generation_cost?: number | null
          id?: string
          model_used?: string
          product_id?: string | null
          prompt_input?: Json
          prompt_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          csv_data: Json
          failed_items: number
          id: string
          name: string
          processed_items: number
          status: string
          successful_items: number
          total_items: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          csv_data: Json
          failed_items?: number
          id?: string
          name: string
          processed_items?: number
          status?: string
          successful_items?: number
          total_items?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          csv_data?: Json
          failed_items?: number
          id?: string
          name?: string
          processed_items?: number
          status?: string
          successful_items?: number
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      processing_logs: {
        Row: {
          batch_id: string | null
          created_at: string
          error_message: string | null
          id: string
          operation_details: Json | null
          operation_type: string
          product_id: string | null
          retry_count: number | null
          status: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          operation_details?: Json | null
          operation_type: string
          product_id?: string | null
          retry_count?: number | null
          status: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          operation_details?: Json | null
          operation_type?: string
          product_id?: string | null
          retry_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_content_status: string | null
          autodoc_url: string | null
          batch_id: string | null
          brand: string
          category: string | null
          created_at: string
          dimensions: string | null
          ebay_data: Json | null
          ebay_item_id: string | null
          id: string
          images: Json | null
          long_description: string | null
          meta_description: string | null
          oe_number: string | null
          oem_numbers: Json | null
          original_title: string | null
          part_number_tags: string[] | null
          price: number | null
          product_name: string | null
          raw_scraped_data: Json | null
          scraping_status: string | null
          seo_title: string | null
          short_description: string | null
          sku: string
          technical_specs: Json | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          ai_content_status?: string | null
          autodoc_url?: string | null
          batch_id?: string | null
          brand: string
          category?: string | null
          created_at?: string
          dimensions?: string | null
          ebay_data?: Json | null
          ebay_item_id?: string | null
          id?: string
          images?: Json | null
          long_description?: string | null
          meta_description?: string | null
          oe_number?: string | null
          oem_numbers?: Json | null
          original_title?: string | null
          part_number_tags?: string[] | null
          price?: number | null
          product_name?: string | null
          raw_scraped_data?: Json | null
          scraping_status?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku: string
          technical_specs?: Json | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          ai_content_status?: string | null
          autodoc_url?: string | null
          batch_id?: string | null
          brand?: string
          category?: string | null
          created_at?: string
          dimensions?: string | null
          ebay_data?: Json | null
          ebay_item_id?: string | null
          id?: string
          images?: Json | null
          long_description?: string | null
          meta_description?: string | null
          oe_number?: string | null
          oem_numbers?: Json | null
          original_title?: string | null
          part_number_tags?: string[] | null
          price?: number | null
          product_name?: string | null
          raw_scraped_data?: Json | null
          scraping_status?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string
          technical_specs?: Json | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
