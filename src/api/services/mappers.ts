export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const toDate = (value: string): Date => new Date(value);

export const centsToReais = (value: number): number =>
  Number((value / 100).toFixed(2));
