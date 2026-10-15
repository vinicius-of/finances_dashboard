export interface Repository<TSelect, TInsert, TPatch> {
  get(id: string): TSelect | undefined;
  getAll(): TSelect[];
  post(data: TInsert): TSelect;
  batchInsert(data: TInsert[]): TSelect[];
  patch(id: string, data: TPatch): TSelect | undefined;
  softDelete(id: string): TSelect | undefined;
  restore(id: string): TSelect | undefined;
}
