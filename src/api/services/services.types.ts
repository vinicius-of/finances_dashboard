export interface IService<TInput, TOutput> {
  execute(input: TInput): TOutput | Promise<TOutput>;
}
