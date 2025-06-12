// Función para formatear números con K y M según las especificaciones
export const formatNumber = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0K";
  }
  
  // Si el número tiene decimales, usar M
  if (count % 1 !== 0) {
    return `${count.toFixed(1)}M`;
  } else {
    // Siempre agregar K por defecto para números enteros
    return `${count}K`;
  }
};

// Función específica para menciones - ahora siempre agrega K o M según la regla
export const formatMentions = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0K menciones";
  }
  
  // Si el número tiene decimales, usar M
  if (count % 1 !== 0) {
    return `${count.toFixed(1)}M menciones`;
  } else {
    // Siempre agregar K por defecto para números enteros
    return `${count}K menciones`;
  }
};

// Función para formatear conteos con la nueva lógica
export const formatCount = (count: number | undefined): string => {
  // Manejar caso de valores undefined o null
  if (count === undefined || count === null) {
    return "0K";
  }
  
  // Si el número tiene decimales, usar M
  if (count % 1 !== 0) {
    return `${count.toFixed(1)}M`;
  } else {
    // Siempre agregar K por defecto para números enteros
    return `${count}K`;
  }
}; 