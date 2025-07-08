interface BankIconProps {
  bankCode: string;
  className?: string;
}

export function BankIcon({ bankCode, className = "w-6 h-6" }: BankIconProps) {
  const normalizedCode = bankCode.padStart(3, '0');
  
  // Mapeamento de códigos de banco para suas cores e iniciais
  const bankData: { [key: string]: { color: string; initials: string; textColor?: string } } = {
    '001': { color: '#FED100', initials: 'BB', textColor: '#003875' },      // Banco do Brasil - Amarelo com texto azul
    '033': { color: '#E60012', initials: 'S', textColor: '#FFFFFF' },       // Santander - Vermelho
    '104': { color: '#0066CC', initials: 'CEF', textColor: '#FFFFFF' },     // Caixa - Azul
    '237': { color: '#CC092F', initials: 'B', textColor: '#FFFFFF' },       // Bradesco - Vermelho escuro
    '341': { color: '#FF6000', initials: 'I', textColor: '#FFFFFF' },       // Itaú - Laranja
    '935': { color: '#4F46E5', initials: 'C', textColor: '#FFFFFF' },       // Crefisa - Azul índigo
    '707': { color: '#1B365C', initials: 'D', textColor: '#FFFFFF' },       // Daycoval - Azul marinho
    '626': { color: '#22C55E', initials: 'F', textColor: '#FFFFFF' },       // Ficsa - Verde
    '012': { color: '#7C3AED', initials: 'I', textColor: '#FFFFFF' },       // Inbursa - Roxo
    '925': { color: '#065F46', initials: 'BNDES', textColor: '#FFFFFF' },   // BNDES - Verde escuro
    '329': { color: '#06B6D4', initials: 'QI', textColor: '#FFFFFF' },      // Banco 329 - Ciano
    'ZEMA': { color: '#F59E0B', initials: 'Z', textColor: '#FFFFFF' },      // ZEMA CFI - Amarelo âmbar
  };
  
  const bank = bankData[normalizedCode] || { color: '#6B7280', initials: 'B', textColor: '#FFFFFF' };
  
  // Detecta se é um ícone pequeno (para tabela) ou maior (para outros contextos)
  const isSmallIcon = className.includes('w-4') || className.includes('h-4');
  
  if (isSmallIcon) {
    // Para ícones pequenos, mostra apenas um ponto colorido sem texto
    return (
      <div className={`rounded-full ${className}`} style={{ backgroundColor: bank.color }}>
      </div>
    );
  }
  
  // Para ícones maiores, mostra com texto
  const fontSize = bank.initials.length > 2 ? '6px' : '8px';
  
  return (
    <div className={`rounded-full flex items-center justify-center ${className}`} style={{ backgroundColor: bank.color }}>
      <span className="font-bold" style={{ fontSize, color: bank.textColor || '#FFFFFF' }}>
        {bank.initials}
      </span>
    </div>
  );
}