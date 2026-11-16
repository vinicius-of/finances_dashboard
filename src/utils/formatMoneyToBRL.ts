const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatMoneyToBRL = (valueInCents: number): string =>
  brlFormatter.format(valueInCents / 100).replace(/\u00a0/g, " ");
