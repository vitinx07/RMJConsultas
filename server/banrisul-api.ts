import fetch from 'node-fetch';

// Configuração da API Bem Promotora
const BEMPROMOTORA_API_BASE_URL = "https://api.techbem.com.br/integracao-corban";
const BEMPROMOTORA_USERNAME = "7048WS";
const BEMPROMOTORA_PASSWORD = "WH63C]M)hUs%";

export interface BanrisulContract {
  contrato: string;
  dataContrato: string;
  pmtOriginal: number;
  refinanciavel: boolean;
  conveniada: string;
  matricula: string;
}

export interface SimulationRequest {
  cpf: string;
  dataNascimento: string;
  conveniada: string;
  contratosRefinanciamento: Array<{
    contrato: string;
    dataContrato: string;
  }>;
  prestacao: number;
  prazo?: string;
  retornarSomenteOperacoesViaveis: boolean;
  // Campos adicionais necessários para a API
  tipoSimulacao?: string;
  plano?: string;
  valorDesejado?: number;
}

export interface SimulationResult {
  valorAF: number;
  prazo: string;
  descricaoPlano: string;
  taxa: number;
  valorParcela: number;
  valorTotal: number;
  tabela?: Array<{
    parcela: number;
    valorParcela: number;
    valorJuros: number;
    valorAmortizacao: number;
    saldoDevedor: number;
  }>;
}

export interface BanrisulApiResponse {
  retorno: SimulationResult[] | null;
  erro?: string;
  codigoErro?: string;
}

export class BanrisulApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: string
  ) {
    super(message);
    this.name = 'BanrisulApiError';
  }
}

export class BanrisulApi {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private async getToken(): Promise<string> {
    // Verificar se o token ainda é válido
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const authUrl = `${BEMPROMOTORA_API_BASE_URL}/Autenticacao/Autenticar`;
    const payload = {
      usuario: BEMPROMOTORA_USERNAME,
      senha: BEMPROMOTORA_PASSWORD
    };

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new BanrisulApiError(
          `Falha na autenticação: ${response.status} ${response.statusText}`,
          response.status,
          await response.text()
        );
      }

      const data = await response.json();
      
      if (data.retorno && data.retorno.jwtToken) {
        this.token = data.retorno.jwtToken;
        // Token válido por 1 hora
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        return this.token;
      }

      throw new BanrisulApiError(
        'Token não encontrado na resposta de autenticação',
        500,
        JSON.stringify(data)
      );
    } catch (error) {
      if (error instanceof BanrisulApiError) {
        throw error;
      }
      throw new BanrisulApiError(
        `Erro de conexão na autenticação: ${error.message}`,
        500
      );
    }
  }

  async getContracts(cpf: string): Promise<BanrisulContract[]> {
    const token = await this.getToken();
    const contractsUrl = `${BEMPROMOTORA_API_BASE_URL}/contratos`;
    
    try {
      const response = await fetch(`${contractsUrl}?CpfCliente=${cpf}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new BanrisulApiError(
          `Erro ao buscar contratos: ${response.status} ${response.statusText}`,
          response.status,
          await response.text()
        );
      }

      const data = await response.json();
      return data.retorno || [];
    } catch (error) {
      if (error instanceof BanrisulApiError) {
        throw error;
      }
      throw new BanrisulApiError(
        `Erro de conexão ao buscar contratos: ${error.message}`,
        500
      );
    }
  }

  async simulateRefinancing(payload: SimulationRequest): Promise<BanrisulApiResponse> {
    const token = await this.getToken();
    const url = `${BEMPROMOTORA_API_BASE_URL}/v2/refinanciamentos`;
    
    // Formatar o payload corretamente
    const formattedPayload = {
      cpf: payload.cpf.replace(/\D/g, ''), // Remove formatação
      dataNascimento: payload.dataNascimento,
      conveniada: payload.conveniada,
      contratosRefinanciamento: payload.contratosRefinanciamento.map(contract => ({
        contrato: contract.contrato.replace(/\D/g, ''), // Remove formatação
        dataContrato: contract.dataContrato.substring(0, 10) // Formato YYYY-MM-DD
      })),
      prestacao: payload.prestacao,
      prazo: payload.prazo || "096",
      retornarSomenteOperacoesViaveis: payload.retornarSomenteOperacoesViaveis
    };

    console.log('Payload formatado para simulação:', JSON.stringify(formattedPayload, null, 2));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erro na simulação';
        
        try {
          const errorData = JSON.parse(errorText);
          
          // Verificar se há erros específicos no response
          if (errorData.erros && errorData.erros.length > 0) {
            const specificErrors = errorData.erros.map(err => err.mensagem).join(', ');
            errorMessage = `Erro na simulação: ${specificErrors}`;
          } else if (errorData.erro) {
            errorMessage = errorData.erro;
          }
        } catch (e) {
          // Se não conseguir parsear, usar mensagem padrão baseada no status
          switch (response.status) {
            case 400:
              errorMessage = 'Dados inválidos para simulação';
              break;
            case 401:
              errorMessage = 'Não autorizado - verifique as credenciais';
              break;
            case 404:
              errorMessage = 'Contrato não encontrado';
              break;
            case 422:
              errorMessage = 'Valor líquido inferior ao mínimo permitido';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor Banrisul';
              break;
          }
        }

        throw new BanrisulApiError(
          errorMessage,
          response.status,
          errorText
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof BanrisulApiError) {
        throw error;
      }
      throw new BanrisulApiError(
        `Erro de conexão na simulação: ${error.message}`,
        500
      );
    }
  }
}

export const banrisulApi = new BanrisulApi();