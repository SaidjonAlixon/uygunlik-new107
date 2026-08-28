import api from "../lib/api";
import { Tariff } from "../types/tariff";

export interface CreateTariffDto {
  name: string;
  description?: string;
  price: number;
}

export interface UpdateTariffDto {
  name?: string;
  description?: string;
  price?: number;
}

class TariffService {
  async findAll(): Promise<Tariff[]> {
    const response = await api.get("/tariffs");
    return response.data;
  }

  async findOne(id: string): Promise<Tariff> {
    const response = await api.get(`/tariffs/${id}`);
    return response.data;
  }

  async create(data: CreateTariffDto): Promise<Tariff> {
    const response = await api.post("/tariffs", data);
    return response.data;
  }

  async update(id: string, data: UpdateTariffDto): Promise<Tariff> {
    const response = await api.patch(`/tariffs/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/tariffs/${id}`);
  }
}

export default new TariffService();

