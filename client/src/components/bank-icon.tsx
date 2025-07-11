interface BankIconProps {
  bankCode: string;
  className?: string;
}

export function BankIcon({ bankCode, className = "w-6 h-6" }: BankIconProps) {
  const normalizedCode = bankCode.padStart(3, '0');
  
  // Mapeamento de códigos de banco para classes CSS dos ícones
  const bankIconClasses: { [key: string]: string } = {
    '001': 'ibb-banco-brasil',      // Banco do Brasil
    '033': 'ibb-santander',         // Santander
    '104': 'ibb-caixa',             // Caixa Econômica Federal
    '237': 'ibb-bradesco',          // Bradesco
    '341': 'ibb-itau',              // Itaú
    '041': 'ibb-banrisul',          // Banrisul
    '748': 'ibb-sicredi',           // Sicredi
    '756': 'ibb-sicoob',            // Sicoob
    '422': 'ibb-safra',             // Safra
    '623': 'ibb-original',          // Original
    '260': 'ibb-nubank',            // Nubank
    '077': 'ibb-inter',             // Inter
    '399': 'ibb-hsbc',              // HSBC
    '745': 'ibb-citi-bank',         // Citibank
    '021': 'ibb-banestes',          // Banestes
    '004': 'ibb-banco-nordeste',    // Banco do Nordeste
    '070': 'ibb-banco-brasilia',    // Banco de Brasília
    '003': 'ibb-banco-amazonia',    // Banco da Amazônia
  };
  
  // Cores de fallback para bancos sem ícone da fonte
  const bankColors: { [key: string]: string } = {
    '001': '#FED100',     // Banco do Brasil
    '033': '#E60012',     // Santander
    '104': '#0066CC',     // Caixa
    '237': '#CC092F',     // Bradesco
    '341': '#FF6000',     // Itaú
    '041': '#1D4ED8',     // Banrisul
    '748': '#00A651',     // Sicredi
    '756': '#00A651',     // Sicoob
    '422': '#FF6B35',     // Safra
    '623': '#FF6B35',     // Original
    '260': '#8A05BE',     // Nubank
    '077': '#FF7A00',     // Inter
    '399': '#DB0011',     // HSBC
    '745': '#1976D2',     // Citibank
    '021': '#0066CC',     // Banestes
    '004': '#0066CC',     // Banco do Nordeste
    '070': '#0066CC',     // Banco de Brasília
    '003': '#0066CC',     // Banco da Amazônia
    '935': '#4F46E5',     // Crefisa
    '707': '#1B365C',     // Daycoval
    '626': '#22C55E',     // Ficsa
    '012': '#7C3AED',     // Inbursa
    '925': '#065F46',     // BNDES
    '329': '#06B6D4',     // Banco 329
    'ZEMA': '#F59E0B',    // ZEMA CFI
  };
  
  const iconClass = bankIconClasses[normalizedCode];
  const fallbackColor = bankColors[normalizedCode] || '#6B7280';
  
  // Detecta se é um ícone pequeno (para tabela) ou maior (para outros contextos)
  const isSmallIcon = className.includes('w-4') || className.includes('h-4');
  
  // PRIORIDADE: Sempre tentar mostrar o ícone real primeiro, independente do tamanho
  if (iconClass) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span 
          className={`${iconClass} ${isSmallIcon ? 'text-sm' : 'text-lg'}`} 
          style={{ color: fallbackColor }}
          title={`Banco ${normalizedCode}`}
        ></span>
      </div>
    );
  }
  
  // FALLBACK: Para ícones pequenos na tabela, usar pontos coloridos só se não tiver ícone
  if (isSmallIcon) {
    return (
      <div className={`rounded-full ${className}`} style={{ backgroundColor: fallbackColor }}>
      </div>
    );
  }
  
  // Fallback: círculo colorido com inicial
  return (
    <div className={`rounded-full flex items-center justify-center ${className}`} style={{ backgroundColor: fallbackColor }}>
      <span className="font-bold text-white text-xs">
        B
      </span>
    </div>
  );
}