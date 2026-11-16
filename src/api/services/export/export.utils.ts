import type { IVentureSnapshot } from "@/contracts";

export const isNewerSnapshot = (
  candidate: IVentureSnapshot,
  current: IVentureSnapshot,
): boolean => {
  const byReferenceDate =
    candidate.referenceDate.getTime() - current.referenceDate.getTime();

  return byReferenceDate > 0
    ? true
    : byReferenceDate < 0
      ? false
      : candidate.createdAt.getTime() > current.createdAt.getTime();
};
