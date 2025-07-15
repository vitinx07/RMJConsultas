import { SearchRequest, Benefit } from "@shared/schema";

export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string, 
    public title?: string, 
    public details?: string
  ) {
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
  const response = await fetch('/api/multicorban/cpf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, cpf }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: 'Erro desconhecido', 
      title: 'Erro de Comunicação',
      details: 'Falha na comunicação com o servidor'
    }));
    
    throw new ApiError(
      response.status, 
      errorData.error || 'Erro ao consultar CPF',
      errorData.title || 'Erro na Consulta',
      errorData.details || 'Detalhes não disponíveis'
    );
  }

  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhum benefício encontrado para este CPF');
  }

  return data;
}

export async function searchByBenefit(apiKey: string, benefitNumber: string): Promise<Benefit> {
  const response = await fetch('/api/multicorban/offline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, beneficio: benefitNumber }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: 'Erro desconhecido', 
      title: 'Erro de Comunicação',
      details: 'Falha na comunicação com o servidor'
    }));
    
    throw new ApiError(
      response.status, 
      errorData.error || 'Erro ao consultar benefício',
      errorData.title || 'Erro na Consulta',
      errorData.details || 'Detalhes não disponíveis'
    );
  }

  const data = await response.json();
  return data;
}

export async function getBenefitDetails(apiKey: string, benefitNumber: string): Promise<Benefit> {
  return await searchByBenefit(apiKey, benefitNumber);
}
