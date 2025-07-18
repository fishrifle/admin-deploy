import { Database } from "./database.types";

// Initiative types now map to the causes table
export type Initiative = Database["public"]["Tables"]["causes"]["Row"];
export type InitiativeInsert = Database["public"]["Tables"]["causes"]["Insert"];
export type InitiativeUpdate = Database["public"]["Tables"]["causes"]["Update"];

export interface InitiativeConfig {
  name: string;
  description?: string;
  goal_amount?: number;
  is_active: boolean;
  widget_id: string;
}

export interface InitiativeWithStats extends Initiative {
  donationsCount: number;
  progressPercentage: number;
}