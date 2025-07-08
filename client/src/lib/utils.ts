import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatBankAccount(bank: string, agency: string, account: string): string {
  return `${bank} - Ag: ${agency} - Conta: ${account}`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    case 'bloqueado':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function calculateMarginPercentage(available: number, total: number): number {
  if (total === 0) return 0;
  return (available / total) * 100;
}

// Mapeamento de códigos de espécie para nomes de benefícios
// Mapeamento de códigos de banco para nomes (principais bancos brasileiros)
export function getBankName(code: string): string {
  const bankMap: { [key: string]: string } = {
    '001': 'Banco do Brasil',
    '003': 'Banco da Amazônia',
    '004': 'Banco do Nordeste',
    '021': 'Banco do Estado do Espírito Santo',
    '025': 'Banco Alfa',
    '033': 'Banco Santander',
    '036': 'Banco Bradesco BBI',
    '037': 'Banco do Estado do Pará',
    '041': 'Banco do Estado do Rio Grande do Sul',
    '047': 'Banco do Estado de Sergipe',
    '070': 'Banco de Brasília',
    '077': 'Banco Inter',
    '104': 'Caixa Econômica Federal',
    '136': 'Banco Unicred',
    '197': 'Stone Pagamentos',
    '208': 'Banco BTG Pactual',
    '212': 'Banco Original',
    '237': 'Banco Bradesco',
    '260': 'Nubank',
    '290': 'Banco PagSeguro',
    '318': 'Banco BMG',
    '323': 'Banco Mercado Pago',
    '336': 'Banco C6',
    '341': 'Itaú Unibanco',
    '380': 'PicPay',
    '399': 'HSBC Bank Brasil',
    '422': 'Banco Safra',
    '604': 'Banco Industrial do Brasil',
    '623': 'Banco Panamericano',
    '633': 'Banco Rendimento',
    '637': 'Banco Sofisa',
    '653': 'Banco Indusval',
    '655': 'Banco Votorantim',
    '707': 'Banco Daycoval',
    '745': 'Banco Citibank',
    '748': 'Banco Cooperativo Sicredi',
    '756': 'Banco Cooperativo do Brasil',
  };

  return bankMap[code] || `Banco ${code}`;
}

// Função para obter cor do banco baseado no código
export function getBankColor(code: string): string {
  const colorMap: { [key: string]: string } = {
    '001': 'bg-yellow-500', // Banco do Brasil
    '033': 'bg-red-600', // Santander
    '104': 'bg-blue-600', // Caixa
    '237': 'bg-red-700', // Bradesco
    '341': 'bg-orange-500', // Itaú
    '260': 'bg-purple-600', // Nubank
    '336': 'bg-yellow-400', // C6
    '290': 'bg-green-600', // PagSeguro
    '323': 'bg-blue-500', // Mercado Pago
    '077': 'bg-orange-600', // Inter
    '380': 'bg-green-500', // PicPay
    '208': 'bg-black', // BTG
    '422': 'bg-green-700', // Safra
  };

  return colorMap[code] || 'bg-gray-500';
}

// Função para obter código do banco baseado no nome
export function getBankCodeFromName(bankName: string): string {
  const nameToCodeMap: { [key: string]: string } = {
    'Banco do Brasil': '001',
    'Santander': '033',
    'Caixa Econômica Federal': '104',
    'Bradesco': '237',
    'Itaú Unibanco': '341',
    'Itau Unibanco': '341',
    'Nubank': '260',
    'Banco C6': '336',
    'PagSeguro': '290',
    'Mercado Pago': '323',
    'Banco Inter': '077',
    'PicPay': '380',
    'BTG Pactual': '208',
    'Safra': '422',
  };
  
  // Busca exata primeiro
  if (nameToCodeMap[bankName]) {
    return nameToCodeMap[bankName];
  }
  
  // Busca parcial (case-insensitive)
  const lowerBankName = bankName.toLowerCase();
  for (const [name, code] of Object.entries(nameToCodeMap)) {
    if (lowerBankName.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerBankName)) {
      return code;
    }
  }
  
  return '000'; // Código padrão para bancos não identificados
}

export function getBenefitSpeciesName(code: string): string {
  const speciesMap: { [key: string]: string } = {
    '01': 'Pensão por Morte de Trabalhador Rural',
    '02': 'Pensão por Morte Acidentária Trabalhador Rural',
    '03': 'Pensão por Morte de Empregador Rural',
    '04': 'Aposentadoria por Invalidez Trabalhador Rural',
    '05': 'Aposentadoria Invalidez Acidentária Trabalhador Rural',
    '06': 'Aposentadoria Invalidez Empregador Rural',
    '07': 'Aposentadoria por Velhice Trabalhador Rural',
    '08': 'Aposentadoria por Idade Empregador Rural',
    '09': 'Compl. Acidente Trabalho p/Trabalhador (rural)',
    '10': 'Auxílio Doença Acidentário Trabalhador Rural',
    '11': 'Amparo Previdenc. Invalidez Trabalhador Rural',
    '12': 'Amparo Previdenc. Idade Trabalhador Rural',
    '13': 'Auxílio Doença Trabalhador Rural',
    '15': 'Auxílio Reclusão Trabalhador Rural',
    '19': 'Pensão de Estudante (lei 7.004/82)',
    '20': 'Pensão por Morte de Ex Diplomata',
    '21': 'Pensão por Morte Previdenciária',
    '22': 'Pensão por Morte Estatutária',
    '23': 'Pensão por Morte de Ex Combatente',
    '24': 'Pensão Especial (ato Institucional)',
    '25': 'Auxílio Reclusão',
    '26': 'Pensão por Morte Especial',
    '27': 'Pensão Morte Servidor Público Federal',
    '28': 'Pensão por Morte Regime Geral',
    '29': 'Pensão por Morte Ex Combatente Marítimo',
    '30': 'Renda Mensal Vitalícia por Incapacidade',
    '31': 'Auxílio Doença Previdenciário',
    '32': 'Aposentadoria Invalidez Previdenciária',
    '33': 'Aposentadoria Invalidez Aeronauta',
    '34': 'Aposentadoria Inval. Ex Combatente Marítimo',
    '35': 'Auxílio Doença do Ex Combatente',
    '36': 'Auxílio Acidente Previdenciário',
    '37': 'Aposentadoria Extranumerário Capin',
    '38': 'Aposentadoria Extranum. Funcionário Público',
    '39': 'Auxílio Invalidez Estudante',
    '40': 'Renda Mensal Vitalícia por Idade',
    '41': 'Aposentadoria por Idade',
    '42': 'Aposentadoria por Tempo de Contribuição',
    '43': 'Aposentadoria por Tempo Serviço Ex Combatente',
    '44': 'Aposentadoria Especial de Aeronauta',
    '45': 'Aposentadoria Tempo Serviço Jornalista',
    '46': 'Aposentadoria Especial',
    '47': 'Abono Permanência em Serviço 35 Anos',
    '48': 'Abono Permanência em Serviço 30 Anos',
    '49': 'Aposentadoria Ordinária',
    '50': 'Auxílio Doença Extinto Plano Básico',
    '51': 'Aposentadoria Invalidez Extinto Plano Básico',
    '52': 'Aposentadoria Idade Extinto Plano Básico',
    '53': 'Auxílio Reclusão Extinto Plano Básico',
    '54': 'Pensão Indenizatória a Cargo da União',
    '55': 'Pensão por Morte Extinto Plano Básico',
    '56': 'Pensão Vitalícia Síndrome Talidomida',
    '57': 'Aposentadoria Tempo de Serviço de Professor',
    '58': 'Aposentadoria de Anistiados',
    '59': 'Pensão por Morte de Anistiados',
    '60': 'Benefício Indenizatório a cargo da União',
    '61': 'Auxílio Natalidade',
    '62': 'Auxílio Funeral',
    '63': 'Auxílio Funeral Trabalhador Rural',
    '64': 'Auxílio Funeral Empregador Rural',
    '65': 'Pecúlio Especial Servidor Autárquico',
    '66': 'Pec. Esp. Servidor Autárquico',
    '67': 'Pecúlio Obrigatório Ex Ipase',
    '68': 'Pecúlio Especial de Aposentados',
    '69': 'Pecúlio de Estudante',
    '70': 'Restituição Contrib. P/Seg. S/Carência',
    '71': 'Salário Família Previdenciário',
    '72': 'Aposentadoria Tempo Serviço Lei de Guerra',
    '73': 'Salário Família Estatutário',
    '74': 'Complemento de Pensão a Conta da União',
    '75': 'Complemento de Aposentadoria a Conta da União',
    '76': 'Salário Família Estatutário',
    '77': 'Salário Fam. Estatutário Servidor Sinpas',
    '78': 'Aposentadoria Idade Lei de Guerra',
    '79': 'Vantagens de Servidor Aposentado',
    '80': 'Auxílio Salário Maternidade',
    '81': 'Aposentadoria Compulsória Ex Sasse',
    '82': 'Aposentadoria Tempo de Serviço Ex Sasse',
    '83': 'Aposentadoria por Invalidez Ex Sasse',
    '84': 'Pensão por Morte Ex Sasse',
    '85': 'Pensão Vitalícia Seringueiros',
    '86': 'Pensão Vitalícia Dependentes Seringueiro',
    '87': 'Amp. Social Pessoa Portadora Deficiência',
    '88': 'Amparo Social ao Idoso',
    '89': 'Pensão Esp. Vítimas Hemodiálise Caruaru',
    '90': 'Simples Assist. Médica p/ Acidente Trabalhador',
    '91': 'Auxílio Doença por Acidente do Trabalho',
    '92': 'Aposentadoria Invalidez Acidente Trabalho',
    '93': 'Pensão por Morte Acidente do Trabalho',
    '94': 'Auxílio Acidente',
    '95': 'Auxílio Suplementar Acidente Trabalho',
    '96': 'Pensão Especial Hanseníase Lei 11520/07',
    '97': 'Pecúlio por Morte Acidente do Trabalho',
    '98': 'Abono Anual de Acidente de Trabalho',
    '99': 'Afastamento Até 15 Dias Acidente Trabalhador'
  };

  return speciesMap[code] || `Espécie ${code}`;
}
