import type { IService } from "@/src/api/services/services.types";
import type {
  IPortfolioSnapshotsReader,
  IPortfolioVenturesReader,
  PortfolioServiceDependencies,
  PortfolioServiceInput,
  PortfolioServiceOutput,
} from "./portfolio.types";

export class PortfolioService
  implements IService<PortfolioServiceInput, PortfolioServiceOutput>
{
  private readonly venturesService: IPortfolioVenturesReader;
  private readonly snapshotsService: IPortfolioSnapshotsReader;

  constructor({
    venturesService,
    snapshotsService,
  }: PortfolioServiceDependencies) {
    this.venturesService = venturesService;
    this.snapshotsService = snapshotsService;
  }

  execute(input: PortfolioServiceInput): PortfolioServiceOutput {
    return this.listTracking(input);
  }

  listTracking({ type }: PortfolioServiceInput): PortfolioServiceOutput {
    return this.venturesService
      .getAll()
      .filter((venture) => !type || venture.type === type)
      .map((venture) => this.snapshotsService.tracking(venture.id));
  }
}
