// Función para formatear números con K y M
export const formatNumber = (count: number): string => {
  if (count >= 1000000) {
    // Para millones
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    // Para miles
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    // Para números menores a 1000
    return count.toString();
  }
};

// Función específica para menciones
export const formatMentions = (count: number): string => {
  return `${formatNumber(count)} menciones`;
};

// Función para formatear conteos sin decimales innecesarios
export const formatCount = (count: number): string => {
  if (count >= 1000000) {
    const millions = count / 1000000;
    return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`;
  } else if (count >= 1000) {
    const thousands = count / 1000;
    return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`;
  } else {
    return count.toString();
  }
}; 