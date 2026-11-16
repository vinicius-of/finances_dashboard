import type { IService } from "@/src/api/services/services.types";
import { validateVentures } from "./validateVentures";
import type {
  ICreateVentureInput,
  IVenturesRepository,
  UpdateVentureInput,
  Venture,
  VentureInput,
  VenturesServiceDependencies,
  VenturesServiceInput,
  VenturesServiceOutput,
} from "./ventures.types";
import { duplicatedInternalCode, notFound } from "./ventures.errors";
import { toInsert, toVenture, toVentureInput } from "./ventures.mappers";
import {
  isUniqueInternalCodeError,
  normalizeVentureInput,
  resolveVentureInput,
} from "./ventures.utils";

export class VenturesService implements IService<
  VenturesServiceInput,
  VenturesServiceOutput
> {
  private readonly repository: IVenturesRepository;

  constructor({ venturesRepository }: VenturesServiceDependencies) {
    this.repository = venturesRepository;
  }

  execute(input: VenturesServiceInput): VenturesServiceOutput {
    switch (input.action) {
      case "validate":
        return this.validate(input.data);
      case "create":
        return this.create(input.data);
      case "update":
        return this.update(input.id, input.data);
      case "get":
        return this.get(input.id);
      case "getAll":
        return this.getAll();
      case "softDelete":
        return this.softDelete(input.id);
    }
  }

  validate(data: ICreateVentureInput): void {
    validateVentures(data);
  }

  create(input: ICreateVentureInput): Venture {
    const normalized = normalizeVentureInput(input);
    const data = resolveVentureInput(normalized);

    this.validate(data);

    try {
      return toVenture(this.repository.post(toInsert(data)));
    } catch (error) {
      if (data.internalCode && isUniqueInternalCodeError(error)) {
        throw duplicatedInternalCode();
      }

      throw error;
    }
  }

  update(id: string, data: UpdateVentureInput): Venture {
    const existing = this.repository.get(id);

    if (!existing) {
      throw notFound(id);
    }

    const merged: VentureInput = { ...toVentureInput(existing), ...data };

    this.validate(merged);

    const row = this.repository.patch(id, toInsert(merged));

    if (!row) {
      throw notFound(id);
    }

    return toVenture(row);
  }

  get(id: string): Venture {
    const row = this.repository.get(id);

    if (!row) {
      throw notFound(id);
    }

    return toVenture(row);
  }

  getAll(): Venture[] {
    return this.repository.getAll().map(toVenture);
  }

  softDelete(id: string): Venture {
    const row = this.repository.softDelete(id);

    if (!row) {
      throw notFound(id);
    }

    return toVenture(row);
  }
}
