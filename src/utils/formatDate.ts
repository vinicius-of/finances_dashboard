export const formatDate = (date: Date): string => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Data inválida");
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};
