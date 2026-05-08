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
export const PROGRAM_LABEL = "C360 SuperNova Yellow";
export const COURSE_LABEL = "1º A ESO";

export const UNITS: readonly Unit[] = [
  {
    code: "C1250",
    number: 0,
    title: "Introducción a SuperNova",
    activities: [{ key: "intro", label: "Introducción" }],
  },
  {
    code: "C1250",
    number: 0,
    title: "Unidad 0. Primeros pasos",
    activities: [
      { key: "u0-programaciones", label: "Primeras Programaciones" },
      { key: "u0-libre", label: "Programación libre" },
      { key: "u0-rojo", label: "Respuesta de código rojo" },
    ],
  },
  {
    code: "C1250",
    number: 1,
    title: "Unidad 1. Robots de alerta de emergencia",
    activities: [
      { key: "u1-escape", label: "Ruta de escape de emergencia" },
      { key: "u1-bomberos", label: "Bomberos al rescate" },
      { key: "u1-demo", label: "SuperNova Demo Day" },
      { key: "u1-promedio", label: "Promedio" },
    ],
  },
  {
    code: "C1250",
    number: 2,
    title: "Unidad 2. Sistemas de agricultura inteligente",
    activities: [
      { key: "u2-suelo", label: "Escaneo del suelo" },
      { key: "u2-riega", label: "Riega si es necesario" },
      { key: "u2-presion", label: "Prueba de presión" },
      { key: "u2-demo", label: "SuperNova Demo Day" },
      { key: "u2-promedio", label: "Promedio" },
    ],
  },
  {
    code: "C1250",
    number: 3,
    title: "Unidad 3. Entrega inteligente",
    activities: [
      { key: "u3-detectar", label: "Presionar o Detectar" },
      { key: "u3-cocina", label: "Entrega de cocina" },
      { key: "u3-color", label: "Código de Color" },
      { key: "u3-demo", label: "SuperNova Demo Day" },
      { key: "u3-promedio", label: "Promedio" },
    ],
  },
  {
    code: "C1250",
    number: 4,
    title: "Unidad 4. Exploradores de sensores oceánicos",
    activities: [
      { key: "u4-arrecife", label: "Informe del arrecife" },
      { key: "u4-distancia", label: "Verificación de distancia" },
      { key: "u4-robot", label: "Mantenimiento del robot" },
      { key: "u4-demo", label: "SuperNova Demo Day" },
      { key: "u4-promedio", label: "Promedio" },
    ],
  },
  {
    code: "C1250",
    number: 5,
    title: "Unidad 5. Control de comunicaciones",
    activities: [
      { key: "u5-muestra", label: "Verificación de muestra" },
      { key: "u5-mensaje", label: "Cuida tu mensaje" },
      { key: "u5-emergencia", label: "Texto de emergencia" },
      { key: "u5-demo", label: "SuperNova Demo Day" },
      { key: "u5-promedio", label: "Promedio" },
    ],
  },
  {
    code: "C1250",
    number: 6,
    title: "Unidad 6. Clasificación inteligente",
    activities: [
      { key: "u6-limpieza", label: "Lista de limpieza oceánica" },
      { key: "u6-clasificar", label: "Escanear y clasificar" },
      { key: "u6-reciclar", label: "Reciclar o eliminar" },
      { key: "u6-demo", label: "SuperNova Demo Day" },
      { key: "u6-promedio", label: "Promedio" },
      { key: "u6-escultura", label: "Escultura cinética" },
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
