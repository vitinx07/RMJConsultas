interface BankIconProps {
  bankCode: string;
  className?: string;
}

// URLs dos SVGs dos bancos (usando URLs públicas)

export function BankIcon({ bankCode, className = "w-6 h-6" }: BankIconProps) {
  const normalizedCode = bankCode.padStart(3, '0');
  
  // URLs dos SVGs dos bancos (carregamento dinâmico)
  const getBankIconUrl = (code: string) => `/src/assets/bank-icons/${code}.svg`;
  
  // Lista de bancos que têm SVG disponível
  const availableBankIcons = ['001', '033', '104', '237', '341', '626', '935', '041'];
  
  // Cores e iniciais para fallback
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
    '041': { color: '#1D4ED8', initials: 'BRS', textColor: '#FFFFFF' },     // Banrisul - Azul
    'ZEMA': { color: '#F59E0B', initials: 'Z', textColor: '#FFFFFF' },      // ZEMA CFI - Amarelo âmbar
  };
  
  const bank = bankData[normalizedCode] || { color: '#6B7280', initials: 'B', textColor: '#FFFFFF' };
  const hasIcon = availableBankIcons.includes(normalizedCode);
  
  // Detecta se é um ícone pequeno (para tabela) ou maior (para outros contextos)
  const isSmallIcon = className.includes('w-4') || className.includes('h-4');
  
  // Para ícones pequenos na tabela, sempre usar pontos coloridos (mais limpo)
  if (isSmallIcon) {
    return (
      <div className={`rounded-full ${className}`} style={{ backgroundColor: bank.color }}>
      </div>
    );
  }
  
  // Para ícones maiores, tentar usar SVG se disponível, senão fallback para círculo com iniciais
  if (hasIcon) {
    const iconUrl = getBankIconUrl(normalizedCode);
    return (
      <div className={`${className} flex items-center justify-center`}>
        <img 
          src={iconUrl} 
          alt={`Logo banco ${normalizedCode}`} 
          className={`${className} object-contain`}
          onError={(e) => {
            // Fallback para círculo com iniciais em caso de erro
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = `rounded-full flex items-center justify-center ${className}`;
              fallbackDiv.style.backgroundColor = bank.color;
              fallbackDiv.innerHTML = `<span class="font-bold" style="color: ${bank.textColor}; font-size: 8px">${bank.initials}</span>`;
              target.parentElement.appendChild(fallbackDiv);
            }
          }}
        />
      </div>
    );
  }
  
  // Fallback padrão: círculo com iniciais
  const fontSize = bank.initials.length > 2 ? '6px' : '8px';
  
  return (
    <div className={`rounded-full flex items-center justify-center ${className}`} style={{ backgroundColor: bank.color }}>
      <span className="font-bold" style={{ fontSize, color: bank.textColor || '#FFFFFF' }}>
        {bank.initials}
      </span>
    </div>
  );
}