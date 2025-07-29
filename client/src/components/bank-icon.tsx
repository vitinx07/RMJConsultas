interface BankIconProps {
  bankCode: string;
  className?: string;
}

export function BankIcon({ bankCode, className = "w-6 h-6" }: BankIconProps) {
  // Verificação de segurança para bankCode
  if (!bankCode) {
    return (
      <div
        className={`${className} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center`}
      >
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
          ?
        </span>
      </div>
    );
  }

  const normalizedCode = String(bankCode).padStart(3, "0");

  // Mapeamento de códigos de banco para ícones externos (imagens)
  const bankExternalIcons: { [key: string]: string } = {
    "254":
      "https://yt3.googleusercontent.com/zE-Ig3Er5UVPUG0F1RrfcTlG6YGzmFEZLCAgB6CANo7sNrfk52nQk7l7tdg5TEGm-Rnf9y1yhg=s900-c-k-c0x00ffffff-no-rj", //Banco Parana

    "626":
      "https://cdn.brandfetch.io/idGbjRMvXY/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", //Banco C6

    "707":
      "https://play-lh.googleusercontent.com/uaDvaAZW8Ls995RWP6ER_F6P8MGCuHE8bmMSRApbakgQ_BJDcm-XJdiu1vXa8ZKO=w240-h480-rw", //Banco Daycoval

    "935":
      "https://evef.com.br/images/vetor/download%20vetor%20crefisa%20financeira%20correspondente%20bancario.jpg", //Banco Crevisa

    "318":
      "https://media.licdn.com/dms/image/v2/D4D0BAQHnYlXN6ors-w/company-logo_200_200/company-logo_200_200/0/1737059054059/bancobmg_logo?e=2147483647&v=beta&t=D3FpNCk41WJ6zGisDO_kCQVh7WnR3IBZ7aGtSu252wk", //Banco BMG

    "012":
      "https://companieslogo.com/img/orig/GFINBURO.MX-bfce3765.png?t=1720244492", //Banco Inbursa

    "954": "https://www.idinheiro.com.br/wp-content/uploads/2021/04/digio.png", //Banco Cbss digio

    "335": "https://www.idinheiro.com.br/wp-content/uploads/2021/04/digio.png", //Banco Digio

    "925":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF_1cWM-TaAlSCFzozM87FgfWL20TLQDIvbw&s", //Banco BRB

    "029":
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ita%C3%BA_Unibanco_logo_2023.svg/1200px-Ita%C3%BA_Unibanco_logo_2023.svg.png", //Banco Itaú consig

    "623": "https://ri.bancopan.com.br/images/logo-pan-big.png", //Banco Pan

    "121":
      "https://s2-valor.glbimg.com/CDYNrCfOkfxpxJUwsfMgyywspSA=/0x0:237x246/888x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_63b422c2caee4269b8b34177e8876b93/internal_photos/bs/2020/w/s/KEa34TR228M4qlxmoYOA/agi-logo.jpg", //Banco Pan

    "643":
      "https://is4-ssl.mzstatic.com/image/thumb/Purple123/v4/cb/6d/7d/cb6d7d6d-70b9-e7f4-7400-646df9dd8931/source/256x256bb.jpg", //Banco Parana

    "389":
      "https://yt3.googleusercontent.com/_yhwAaz2w1Fq8RdLx0IYJ2FNGpXJQrcr-VcYO-mFf_J_W6mCj-9MCjcnZEV3DoM2BsA3lz4AQR4=s900-c-k-c0x00ffffff-no-rj", //Banco Mercantil

    "359":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkYql2Zl9Ti5Cz6E5CCuoEB0unbErHje6WsQ&s", //Banco Zema

    "422": "https://gestao.sistemacorban.com.br/imagens/0422.5c21f943.svg", //Banco Safra

    "001": "https://gestao.sistemacorban.com.br/imagens/0001.e743891b.svg", //Banco BB

    "079": "https://cdn.brandfetch.io/id-EZkq3JI/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B", //Banco Picpay

    "908": "https://media.licdn.com/dms/image/v2/C4D0BAQEdzHu5qfDFYQ/company-logo_200_200/company-logo_200_200/0/1630541214338?e=2147483647&v=beta&t=-BRE56c3A7P2gHaWSmsH_SPPJ9kCxgz4gcmjBKBjeRo", //Banco Parati
  };

  // mapeamento de codigos de banco para classes CSS dos icones do github
  const bankIconClasses: { [key: string]: string } = {
    "001": "ibb-banco-brasil", // Banco do Brasil
    "033": "ibb-santander", // Santander
    "104": "ibb-caixa", // Caixa Econômica Federal
    "237": "ibb-bradesco", // Bradesco
    "341": "ibb-itau", // Itaú
    "041": "ibb-banrisul", // Banrisul
    "748": "ibb-sicredi", // Sicredi
    "756": "ibb-sicoob", // Sicoob
    "422": "ibb-safra", // Safra
    "623": "ibb-original", // Original
    "260": "ibb-nubank", // Nubank
    "077": "ibb-inter", // Inter
    "399": "ibb-hsbc", // HSBC
    "745": "ibb-citi-bank", // Citibank
    "021": "ibb-banestes", // Banestes
    "004": "ibb-banco-nordeste", // Banco do Nordeste
    "070": "ibb-banco-brasilia", // Banco de Brasília
    "003": "ibb-banco-amazonia", // Banco da Amazônia
  };

  // Cores de fallback para bancos sem icone da fonte
  const bankColors: { [key: string]: string } = {
    "001": "#FED100", // Banco do Brasil
    "033": "#E60012", // Santander
    "104": "#0066CC", // Caixa
    "237": "#CC092F", // Bradesco
    "341": "#FF6000", // Itaú
    "041": "#1D4ED8", // Banrisul
    "748": "#00A651", // Sicredi
    "756": "#00A651", // Sicoob
    "422": "#FF6B35", // Safra
    "623": "#FF6B35", // Original
    "260": "#8A05BE", // Nubank
    "077": "#FF7A00", // Inter
    "399": "#DB0011", // HSBC
    "745": "#1976D2", // Citibank
    "021": "#0066CC", // Banestes
    "004": "#0066CC", // Banco do Nordeste
    "070": "#0066CC", // Banco de Brasília
    "003": "#0066CC", // Banco da Amazônia
    "935": "#4F46E5", // Crefisa
    "707": "#1B365C", // Daycoval
    "626": "#22C55E", // Ficsa
    "012": "#7C3AED", // Inbursa
    "925": "#065F46", // BNDES
    "329": "#06B6D4", // Banco 329
    ZEMA: "#F59E0B", // ZEMA CFI
    "254": "#1E40AF", // Banco Pine
    "029": "#1E40AF", // Banco Itau consig
  };

  const iconClass = bankIconClasses[normalizedCode];
  const externalIcon = bankExternalIcons[normalizedCode];
  const fallbackColor = bankColors[normalizedCode] || "#6B7280";

  // Detecta se é um ícone pequeno (para tabela) ou maior (para outros contextos)
  const isSmallIcon = className.includes("w-4") || className.includes("h-4");

  // PRIORIDADE 1: Ícones externos (imagens)
  if (externalIcon) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <img
          src={externalIcon}
          alt={`Banco ${normalizedCode}`}
          className={`${className} object-contain rounded-sm`}
          title={`Banco ${normalizedCode}`}
          onError={(e) => {
            // Se a imagem falhar, mostrar fallback
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement!.innerHTML = `<div class="rounded-full flex items-center justify-center ${className}" style="background-color: ${fallbackColor}"><span class="font-bold text-white text-xs">B</span></div>`;
          }}
        />
      </div>
    );
  }

  // PRIORIDADE 2: Ícones CSS da fonte
  if (iconClass) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span
          className={`${iconClass} ${isSmallIcon ? "text-sm" : "text-lg"}`}
          style={{ color: fallbackColor }}
          title={`Banco ${normalizedCode}`}
        ></span>
      </div>
    );
  }

  // FALLBACK: Para ícones pequenos na tabela, usar pontos coloridos só se não tiver ícone
  if (isSmallIcon) {
    return (
      <div
        className={`rounded-full ${className}`}
        style={{ backgroundColor: fallbackColor }}
      ></div>
    );
  }

  // Fallback: círculo colorido com inicial
  return (
    <div
      className={`rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: fallbackColor }}
    >
      <span className="font-bold text-white text-xs">B</span>
    </div>
  );
}
