export const SPHERES = [
  'health',
  'career',
  'finance',
  'family',
  'friends',
  'growth',
  'leisure',
  'inner',
] as const;

export type Sphere = (typeof SPHERES)[number];

const SPHERE_SET = new Set<string>(SPHERES);

export const parseSphere = (input: string): Sphere | null =>
  SPHERE_SET.has(input) ? (input as Sphere) : null;

const SPHERE_LABELS: Record<Sphere, string> = {
  health: 'Здоровье и тело',
  career: 'Карьера и самореализация',
  finance: 'Финансы',
  family: 'Семья и партнёр',
  friends: 'Друзья и окружение',
  growth: 'Развитие и обучение',
  leisure: 'Отдых и увлечения',
  inner: 'Внутренний мир',
};

export const getSphereLabel = (sphere: Sphere): string => SPHERE_LABELS[sphere];

export const getSphereIconKey = (sphere: Sphere): string => `sphere-${sphere}`;
