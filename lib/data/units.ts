export type UnitActivity = {
  key: string;
  label: string;
};

export type Unit = {
  code: string;
  number: number;
  title: string;
  activities: readonly UnitActivity[];
};

export const PROGRAM_CODE = "C1250";
export const PROGRAM_LABEL = "C1250 · Superhéroes futuro X";
export const COURSE_LABEL = "1º ESO";

export const UNITS: readonly Unit[] = [
  {
    code: "C1250",
    number: 1,
    title: "Historia de origen y emergencia",
    activities: [
      { key: "u1-intro", label: "Introducción" },
      { key: "u1-explor", label: "Explorando" },
      { key: "u1-comput", label: "Pensamiento computacional" },
      { key: "u1-reto", label: "Reto Superhéroe" },
    ],
  },
  {
    code: "C1250",
    number: 2,
    title: "Exploradores de agricultura inteligente",
    activities: [
      { key: "u2-intro", label: "Introducción" },
      { key: "u2-monta", label: "Montaje" },
      { key: "u2-prog", label: "Programación" },
      { key: "u2-reto", label: "Reto Cultivos" },
    ],
  },
  {
    code: "C1250",
    number: 3,
    title: "Entrega de paquetes mediante drones",
    activities: [
      { key: "u3-intro", label: "Introducción" },
      { key: "u3-rutas", label: "Rutas" },
      { key: "u3-sensor", label: "Sensores" },
      { key: "u3-reto", label: "Reto Logística" },
    ],
  },
  {
    code: "C1250",
    number: 4,
    title: "Exploradores de cosechas",
    activities: [
      { key: "u4-intro", label: "Introducción" },
      { key: "u4-mapeo", label: "Mapeo del terreno" },
      { key: "u4-prog", label: "Programación guiada" },
      { key: "u4-reto", label: "Reto Cosecha" },
    ],
  },
  {
    code: "C1250",
    number: 5,
    title: "Control de cosechadora",
    activities: [
      { key: "u5-intro", label: "Introducción" },
      { key: "u5-mecan", label: "Mecanismos" },
      { key: "u5-control", label: "Control remoto" },
      { key: "u5-reto", label: "Reto Cosechadora" },
    ],
  },
  {
    code: "C1250",
    number: 6,
    title: "Clasificación inteligente",
    activities: [
      { key: "u6-intro", label: "Introducción" },
      { key: "u6-vision", label: "Visión por computador" },
      { key: "u6-clasif", label: "Clasificador" },
      { key: "u6-reto", label: "Reto Final" },
    ],
  },
] as const;

export type FlatColumn = {
  unitNumber: number;
  unitTitle: string;
  activity: UnitActivity;
  index: number;
};

export const FLAT_COLUMNS: readonly FlatColumn[] = UNITS.flatMap((unit) =>
  unit.activities.map((activity, i) => ({
    unitNumber: unit.number,
    unitTitle: unit.title,
    activity,
    index: i,
  })),
).map((c, i) => ({ ...c, index: i }));
