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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      courier_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          license_number: string | null
          rating: number | null
          total_deliveries: number | null
          updated_at: string | null
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string
          vehicle_type: Database["public"]["Enums"]["ride_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate: string
          vehicle_type: Database["public"]["Enums"]["ride_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string
          vehicle_type?: Database["public"]["Enums"]["ride_type"]
        }
        Relationships: [
          {
            foreignKeyName: "courier_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          app_fee: number | null
          assigned_at: string | null
          base_fare: number | null
          cod_amount: number | null
          courier_id: string | null
          created_at: string | null
          delivered_at: string | null
          dropoff_address: string
          dropoff_lat: number | null
          dropoff_lng: number | null
          id: string
          package_description: string
          package_size: Database["public"]["Enums"]["package_size"]
          picked_up_at: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          receiver_name: string
          receiver_phone: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"] | null
          top_up_fare: number | null
          total_fare: number | null
          updated_at: string | null
        }
        Insert: {
          app_fee?: number | null
          assigned_at?: string | null
          base_fare?: number | null
          cod_amount?: number | null
          courier_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dropoff_address: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          package_description: string
          package_size: Database["public"]["Enums"]["package_size"]
          picked_up_at?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          receiver_name: string
          receiver_phone: string
          sender_id: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          top_up_fare?: number | null
          total_fare?: number | null
          updated_at?: string | null
        }
        Update: {
          app_fee?: number | null
          assigned_at?: string | null
          base_fare?: number | null
          cod_amount?: number | null
          courier_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dropoff_address?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          package_description?: string
          package_size?: Database["public"]["Enums"]["package_size"]
          picked_up_at?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          receiver_name?: string
          receiver_phone?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          top_up_fare?: number | null
          total_fare?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          id: string
          is_available: boolean | null
          license_number: string | null
          location_updated_at: string | null
          rating: number | null
          total_rides: number | null
          updated_at: string | null
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string
          vehicle_type: Database["public"]["Enums"]["ride_type"]
        }
        Insert: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          location_updated_at?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate: string
          vehicle_type: Database["public"]["Enums"]["ride_type"]
        }
        Update: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          location_updated_at?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string
          vehicle_type?: Database["public"]["Enums"]["ride_type"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fare_configs: {
        Row: {
          base_fare: number
          id: string
          min_fare: number
          per_km: number
          per_min: number
          platform_fee_type: string
          platform_fee_value: number
          region_code: string
          service_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_fare?: number
          id?: string
          min_fare?: number
          per_km?: number
          per_min?: number
          platform_fee_type?: string
          platform_fee_value?: number
          region_code?: string
          service_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_fare?: number
          id?: string
          min_fare?: number
          per_km?: number
          per_min?: number
          platform_fee_type?: string
          platform_fee_value?: number
          region_code?: string
          service_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fare_settings: {
        Row: {
          base_fare: number
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          service_type: string
          updated_at: string
        }
        Insert: {
          base_fare?: number
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          service_type: string
          updated_at?: string
        }
        Update: {
          base_fare?: number
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          confidence: number
          created_at: string
          doc_type: string
          id: string
          image_path: string | null
          parsed: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          doc_type: string
          id?: string
          image_path?: string | null
          parsed: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          doc_type?: string
          id?: string
          image_path?: string | null
          parsed?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string | null
          created_at: string | null
          current_session_token: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          created_at?: string | null
          current_session_token?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          created_at?: string | null
          current_session_token?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          accepted_at: string | null
          app_fee: number | null
          base_fare: number | null
          completed_at: string | null
          created_at: string | null
          driver_id: string | null
          drivers_notified: Json | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_location: string
          fare_estimate: number | null
          fare_final: number | null
          id: string
          max_radius_reached: boolean | null
          negotiation_notes: string | null
          negotiation_status: string | null
          notes: string | null
          passenger_count: number | null
          passenger_id: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string
          proposals: Json | null
          proposed_top_up_fare: number | null
          ride_type: Database["public"]["Enums"]["ride_type"]
          search_radius: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"] | null
          top_up_fare: number | null
          total_fare: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          app_fee?: number | null
          base_fare?: number | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          drivers_notified?: Json | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location: string
          fare_estimate?: number | null
          fare_final?: number | null
          id?: string
          max_radius_reached?: boolean | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          notes?: string | null
          passenger_count?: number | null
          passenger_id: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location: string
          proposals?: Json | null
          proposed_top_up_fare?: number | null
          ride_type: Database["public"]["Enums"]["ride_type"]
          search_radius?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          top_up_fare?: number | null
          total_fare?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          app_fee?: number | null
          base_fare?: number | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          drivers_notified?: Json | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location?: string
          fare_estimate?: number | null
          fare_final?: number | null
          id?: string
          max_radius_reached?: boolean | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          notes?: string | null
          passenger_count?: number | null
          passenger_id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string
          proposals?: Json | null
          proposed_top_up_fare?: number | null
          ride_type?: Database["public"]["Enums"]["ride_type"]
          search_radius?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          top_up_fare?: number | null
          total_fare?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_accounts: {
        Row: {
          balance: number
          created_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          reference: string | null
          related_delivery_id: string | null
          related_ride_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string | null
          related_delivery_id?: string | null
          related_ride_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string | null
          related_delivery_id?: string | null
          related_ride_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_related_delivery_id_fkey"
            columns: ["related_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_related_ride_id_fkey"
            columns: ["related_ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      wallet_apply_transaction: {
        Args: {
          p_actor_user_id?: string
          p_amount: number
          p_delivery_id?: string
          p_reference?: string
          p_ride_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "kx_admin" | "kx_moderator"
      delivery_status:
        | "requested"
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      package_size: "small" | "medium" | "large"
      ride_status:
        | "requested"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      ride_type: "motor" | "tricycle" | "car"
      user_role: "passenger" | "driver" | "sender" | "courier"
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
      app_role: ["kx_admin", "kx_moderator"],
      delivery_status: [
        "requested",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      package_size: ["small", "medium", "large"],
      ride_status: [
        "requested",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      ride_type: ["motor", "tricycle", "car"],
      user_role: ["passenger", "driver", "sender", "courier"],
    },
  },
} as const
