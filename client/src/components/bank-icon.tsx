interface BankIconProps {
  bankCode: string;
  className?: string;
}

export function BankIcon({ bankCode, className = "w-6 h-6" }: BankIconProps) {
  const normalizedCode = bankCode.padStart(3, '0');
  
  // Mapeamento de códigos de banco para suas cores e iniciais
  const bankData: { [key: string]: { color: string; initials: string } } = {
    '001': { color: '#FED100', initials: 'BB' },      // Banco do Brasil
    '033': { color: '#E60012', initials: 'S' },       // Santander
    '104': { color: '#0066CC', initials: 'CEF' },     // Caixa
    '237': { color: '#CC092F', initials: 'B' },       // Bradesco
    '341': { color: '#FF6000', initials: 'I' },       // Itaú
    '935': { color: '#007B3A', initials: 'C' },       // Crefisa
    '707': { color: '#1B365C', initials: 'D' },       // Daycoval
    '626': { color: '#8B4513', initials: 'F' },       // Ficsa
    '012': { color: '#4B0082', initials: 'I' },       // Inbursa
    '925': { color: '#006400', initials: 'BNDES' },   // BNDES
  };
  
  const bank = bankData[normalizedCode] || { color: '#6B7280', initials: 'B' };
  const fontSize = bank.initials.length > 2 ? '6px' : '8px';
  
  return (
    <div className={`rounded-full flex items-center justify-center ${className}`} style={{ backgroundColor: bank.color }}>
      <span className="text-white font-bold" style={{ fontSize }}>
        {bank.initials}
      </span>
    </div>
  );
}