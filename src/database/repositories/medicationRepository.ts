import type { NativeDB } from "../nativeDb";
import { Medication } from "../../types/domain";

function rowToMedication(row: any): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPaused: row.is_paused === 1,
  };
}

export function createMedicationRepository(db: NativeDB) {
  async function getAll(): Promise<Medication[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM medications ORDER BY created_at DESC"
    );
    return rows.map(rowToMedication);
  }

  async function getById(id: string): Promise<Medication | null> {
    const row = await db.getFirstAsync(
      "SELECT * FROM medications WHERE id = ?",
      id
    );
    return row ? rowToMedication(row) : null;
  }

  async function create(medication: Medication): Promise<void> {
    await db.runAsync(
      `INSERT INTO medications (id, name, dosage, notes, created_at, updated_at, is_paused)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      medication.id,
      medication.name,
      medication.dosage,
      medication.notes,
      medication.createdAt,
      medication.updatedAt,
      medication.isPaused ? 1 : 0
    );
  }

  async function update(medication: Medication): Promise<void> {
    await db.runAsync(
      `UPDATE medications SET name = ?, dosage = ?, notes = ?, updated_at = ?, is_paused = ?
       WHERE id = ?`,
      medication.name,
      medication.dosage,
      medication.notes,
      medication.updatedAt,
      medication.isPaused ? 1 : 0,
      medication.id
    );
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync("DELETE FROM medications WHERE id = ?", id);
  }

  return { getAll, getById, create, update, remove };
}

export type MedicationRepository = ReturnType<typeof createMedicationRepository>;
