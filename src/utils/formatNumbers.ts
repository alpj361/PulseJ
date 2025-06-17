// Función para formatear números con K y M según las especificaciones
export const formatNumber = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0";
  }
  
  // Para números >= 1,000,000 usar M
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  // Para números >= 1,000 usar K
  else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  // Para números < 1,000 mostrar el número sin sufijo
  else {
    return count.toString();
  }
};

// Función específica para menciones - ahora siempre agrega K o M según la regla
export const formatMentions = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0 menciones";
  }
  
  // Para números >= 1,000,000 usar M
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M menciones`;
  }
  // Para números >= 1,000 usar K
  else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K menciones`;
  }
  // Para números < 1,000 mostrar el número sin sufijo
  else {
    return `${count} menciones`;
  }
};

// Función para formatear conteos con la nueva lógica
export const formatCount = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0";
  }
  
  // Para números >= 1,000,000 usar M
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  // Para números >= 1,000 usar K
  else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  // Para números < 1,000 mostrar el número sin sufijo
  else {
    return count.toString();
  }
}; 