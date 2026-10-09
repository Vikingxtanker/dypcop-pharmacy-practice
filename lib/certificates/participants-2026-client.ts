import { supabase } from "@/lib/supabase";
import type { Participant2026 } from "./participants-2026-search";

const PARTICIPANTS_TABLE = "participants2026";
const SELECT_COLUMNS = "id, name, phone, prefix";

let cache: Promise<Participant2026[]> | null = null;

async function fetchParticipants2026(): Promise<Participant2026[]> {
  const { data, error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .select(SELECT_COLUMNS)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as Participant2026[] | null) ?? [];
}

export function getParticipants2026(): Promise<Participant2026[]> {
  if (!cache) {
    cache = fetchParticipants2026().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export function resetParticipants2026Cache(): void {
  cache = null;
}
