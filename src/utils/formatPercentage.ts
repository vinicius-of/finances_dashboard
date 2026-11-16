const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

export const formatPercentage = (value: number): string =>
  `${percentageFormatter.format(value)}%`;
