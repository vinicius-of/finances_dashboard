import type { IPortfolioSummary, IVentureSnapshot } from "@/contracts";
import { ApiHeadersInit } from "@/static";
import { toDateOnly } from "@/src/api/services/mappers";
import type { IService } from "@/src/api/services/services.types";
import type { Venture } from "@/src/api/services/ventures/ventures.types";
import type {
  ExportPayload,
  ExportServiceDependencies,
  ExportServiceInput,
  ExportServiceOutput,
  IExportSnapshotsReader,
  IExportVenturesReader,
} from "./export.types";
import { isNewerSnapshot } from "./export.utils";
import {
  toExportSnapshot,
  toExportSummary,
  toExportTracking,
  toExportVenture,
} from "./export.mappers";

export class ExportService implements IService<
  ExportServiceInput,
  ExportServiceOutput
> {
  private readonly venturesService: IExportVenturesReader;
  private readonly snapshotsService: IExportSnapshotsReader;

  constructor({
    venturesService,
    snapshotsService,
  }: ExportServiceDependencies) {
    this.venturesService = venturesService;
    this.snapshotsService = snapshotsService;
  }

  execute(_input: ExportServiceInput): ExportServiceOutput {
    return this.download();
  }

  private download(): Response {
    const ventures = this.venturesService.getAll();
    const snapshots = this.snapshotsService.getAll();
    const tracking = ventures.map((venture) =>
      this.snapshotsService.tracking(venture.id),
    );

    const payload: ExportPayload = {
      exportedAt: new Date().toISOString(),
      ventures: ventures.map(toExportVenture),
      snapshots: snapshots.map(toExportSnapshot),
      tracking: tracking.map(toExportTracking),
      summary: toExportSummary(this.buildSummary(ventures, snapshots)),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...ApiHeadersInit,
        "Content-Disposition": `attachment; filename="finances-export-${toDateOnly(new Date())}.json"`,
      },
    });
  }

  private buildSummary(
    ventures: Venture[],
    snapshots: IVentureSnapshot[],
  ): IPortfolioSummary {
    const latestByVenture = new Map<string, IVentureSnapshot>();

    for (const snapshot of snapshots) {
      const current = latestByVenture.get(snapshot.ventureId);

      if (!current || isNewerSnapshot(snapshot, current)) {
        latestByVenture.set(snapshot.ventureId, snapshot);
      }
    }

    const latestSnapshots = [...latestByVenture.values()];
    const totalInvested = ventures.reduce(
      (total, venture) => total + venture.initialValue,
      0,
    );
    const currentTotalBalance = latestSnapshots.reduce(
      (total, snapshot) => total + snapshot.currentTotalValue,
      0,
    );
    const totalGrossProfit = latestSnapshots.reduce(
      (total, snapshot) => total + snapshot.grossProfit,
      0,
    );
    const overallProfitabilityPercentage =
      totalInvested > 0 ? (totalGrossProfit / totalInvested) * 100 : 0;
    const categoryTotal = (category: Venture["category"]): number =>
      ventures
        .filter((venture) => venture.category === category)
        .reduce(
          (total, venture) =>
            total + (latestByVenture.get(venture.id)?.currentTotalValue ?? 0),
          0,
        );
    const lastUpdated =
      latestSnapshots.length > 0
        ? new Date(
            Math.max(
              ...latestSnapshots.map((snapshot) =>
                snapshot.createdAt.getTime(),
              ),
            ),
          )
        : new Date();

    return {
      totalInvested,
      currentTotalBalance,
      totalGrossProfit,
      overallProfitabilityPercentage,
      fixedIncomeTotal: categoryTotal("FIXED"),
      variableIncomeTotal: categoryTotal("VARIABLE"),
      lastUpdated,
    };
  }
}
