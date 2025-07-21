/**
 * Utilitários para formatação e validação de CPF
 */

/**
 * Remove todos os caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formata o CPF para o padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);
  
  // Preenche com zeros à esquerda se necessário
  const padded = cleaned.padStart(11, '0');
  
  // Aplica a formatação
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida se o CPF é válido
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

/**
 * Formata e valida CPF automaticamente
 * Retorna o CPF formatado se válido, ou string vazia se inválido
 */
export function formatAndValidateCPF(cpf: string): { formatted: string; isValid: boolean } {
  const cleaned = cleanCPF(cpf);
  const formatted = formatCPF(cleaned);
  const isValid = isValidCPF(cleaned);
  
  return { formatted, isValid };
}