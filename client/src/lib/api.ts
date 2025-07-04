import { SearchRequest, Benefit } from "@shared/schema";

const API_BASE_URL = 'https://api.multicorban.com';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function searchBenefits(request: SearchRequest): Promise<Benefit[]> {
  const { apiKey, searchType, searchValue } = request;
  
  if (searchType === 'cpf') {
    return await searchByCPF(apiKey, searchValue);
  } else {
    const benefit = await searchByBenefit(apiKey, searchValue);
    return [benefit];
  }
}

export async function searchByCPF(apiKey: string, cpf: string): Promise<Benefit[]> {
  const response = await fetch(`${API_BASE_URL}/cpf`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cpf }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, `Erro ao consultar CPF: ${errorText}`);
  }

  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum benefício encontrado para este CPF');
  }

  return data;
}

export async function searchByBenefit(apiKey: string, benefitNumber: string): Promise<Benefit> {
  const response = await fetch(`${API_BASE_URL}/offline`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ beneficio: benefitNumber }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, `Erro ao consultar benefício: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

export async function getBenefitDetails(apiKey: string, benefitNumber: string): Promise<Benefit> {
  return await searchByBenefit(apiKey, benefitNumber);
}
