import {
  validateMedicationName,
  validateDosage,
  validateTimeHHMM,
  validateSchedule,
  normalizeMedicationInput,
  normalizeScheduleInput,
  validateProfileName,
} from "../validation";

describe("validateProfileName", () => {
  it("requires a non-empty local profile name", () => {
    expect(validateProfileName("   ")).toBe("Informe como podemos chamar você.");
  });

  it("accepts and trims a real name", () => {
    expect(validateProfileName("  Miguel  ")).toBeNull();
  });
});

describe("validateMedicationName", () => {
  it("returns error for empty name", () => {
    expect(validateMedicationName("")).toBe("O nome do medicamento é obrigatório.");
  });

  it("returns error for whitespace-only name", () => {
    expect(validateMedicationName("   ")).toBe("O nome do medicamento é obrigatório.");
  });

  it("returns null for valid name", () => {
    expect(validateMedicationName("Losartan")).toBeNull();
  });
});

describe("validateDosage", () => {
  it("returns null for empty dosage (optional)", () => {
    expect(validateDosage("")).toBeNull();
  });

  it("returns null for valid dosage", () => {
    expect(validateDosage("50mg")).toBeNull();
  });

  it("returns null for whitespace-only (treated as empty)", () => {
    expect(validateDosage("   ")).toBeNull();
  });
});

describe("validateTimeHHMM", () => {
  it("returns null for valid 08:00", () => {
    expect(validateTimeHHMM("08:00")).toBeNull();
  });

  it("returns null for valid 23:59", () => {
    expect(validateTimeHHMM("23:59")).toBeNull();
  });

  it("returns null for valid 00:00", () => {
    expect(validateTimeHHMM("00:00")).toBeNull();
  });

  it("returns error for 8:00 (missing leading zero)", () => {
    expect(validateTimeHHMM("8:00")).toBe("Formato de horário inválido. Use HH:MM (ex: 08:00).");
  });

  it("returns error for 24:00", () => {
    expect(validateTimeHHMM("24:00")).toBe("Formato de horário inválido. Use HH:MM (ex: 08:00).");
  });

  it("returns error for 12:60", () => {
    expect(validateTimeHHMM("12:60")).toBe("Formato de horário inválido. Use HH:MM (ex: 08:00).");
  });

  it("returns error for empty string", () => {
    expect(validateTimeHHMM("")).toBe("O horário é obrigatório.");
  });

  it("returns error for invalid format abc", () => {
    expect(validateTimeHHMM("abc")).toBe("Formato de horário inválido. Use HH:MM (ex: 08:00).");
  });
});

describe("validateSchedule", () => {
  it("returns error for empty kind", () => {
    const result = validateSchedule({ kind: "" as any, times: [], intervalHours: 0, weekdays: [] });
    expect(result).toContain("O tipo de agendamento é obrigatório.");
  });

  it("returns error for dailyTimes with empty times", () => {
    const result = validateSchedule({ kind: "dailyTimes", times: [], intervalHours: 0, weekdays: [] });
    expect(result).toContain("Informe pelo menos um horário.");
  });

  it("returns error for dailyTimes with invalid time", () => {
    const result = validateSchedule({ kind: "dailyTimes", times: ["25:00"], intervalHours: 0, weekdays: [] });
    expect(result).toContain("Formato de horário inválido");
  });

  it("returns error for intervalHours with invalid hours", () => {
    const result = validateSchedule({ kind: "intervalHours", times: ["08:00"], intervalHours: 0, weekdays: [] });
    expect(result).toContain("O intervalo deve ser de pelo menos 1 hora.");
  });

  it("returns error for weekdays with empty weekdays", () => {
    const result = validateSchedule({ kind: "weekdays", times: ["08:00"], intervalHours: 0, weekdays: [] });
    expect(result).toContain("Selecione pelo menos um dia da semana.");
  });

  it("returns null for valid dailyTimes schedule", () => {
    const result = validateSchedule({ kind: "dailyTimes", times: ["08:00", "20:00"], intervalHours: 0, weekdays: [] });
    expect(result).toBeNull();
  });

  it("returns null for valid intervalHours schedule", () => {
    const result = validateSchedule({ kind: "intervalHours", times: ["08:00"], intervalHours: 8, weekdays: [] });
    expect(result).toBeNull();
  });

  it("returns null for valid weekdays schedule", () => {
    const result = validateSchedule({ kind: "weekdays", times: ["08:00"], intervalHours: 0, weekdays: [1, 3, 5] });
    expect(result).toBeNull();
  });
});

describe("normalizeMedicationInput", () => {
  it("trims name and notes, defaults dosage", () => {
    const result = normalizeMedicationInput({ name: "  Losartan  ", dosage: "", notes: "  test  " });
    expect(result).toEqual({ name: "Losartan", dosage: "Sem dosagem", notes: "test" });
  });

  it("keeps existing dosage when provided", () => {
    const result = normalizeMedicationInput({ name: "Losartan", dosage: "50mg", notes: "" });
    expect(result).toEqual({ name: "Losartan", dosage: "50mg", notes: "" });
  });
});

describe("normalizeScheduleInput", () => {
  it("sets default values for dailyTimes", () => {
    const result = normalizeScheduleInput({ kind: "dailyTimes", times: ["08:00"] });
    expect(result).toEqual({
      kind: "dailyTimes",
      times: ["08:00"],
      intervalHours: 0,
      weekdays: [],
      startDate: "",
      endDate: "",
      anchorAt: "",
      snoozeMinutes: 5,
      isActive: true,
    });
  });

  it("sets default values for intervalHours", () => {
    const result = normalizeScheduleInput({ kind: "intervalHours", times: ["08:00"], intervalHours: 8 });
    expect(result.intervalHours).toBe(8);
    expect(result.snoozeMinutes).toBe(5);
  });
});
