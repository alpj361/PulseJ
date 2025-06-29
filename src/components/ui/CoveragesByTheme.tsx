import React, { useEffect, useState } from 'react';
import { FiMapPin, FiAlertTriangle, FiRefreshCw, FiChevronDown, FiZap, FiEye, FiSearch } from 'react-icons/fi';
import { autoDetectCoverages, getFindingsByTheme, AutoDetectResponse, CapturadoCard } from '../../services/coverages';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Button } from './button';

interface Props {
  projectId: string;
}

interface ThemeGroup {
  theme: string;
  findings: CapturadoCard[];
  countries: Set<string>;
  departments: Set<string>;
  cities: Set<string>;
}

export default function CoveragesByTheme({ projectId }: Props) {
  const [themeGroups, setThemeGroups] = useState<ThemeGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [showFindings, setShowFindings] = useState<string | null>(null);
  const [autoDetectResult, setAutoDetectResult] = useState<AutoDetectResponse | null>(null);

  useEffect(() => {
    fetchThemeGroups();
  }, [projectId]);

  async function fetchThemeGroups() {
    try {
      setLoading(true);
      setError(null);
      const findingsByTheme = await getFindingsByTheme(projectId);
      
      const groups: ThemeGroup[] = Object.entries(findingsByTheme).map(([theme, findings]) => {
        const countries = new Set<string>();
        const departments = new Set<string>();
        const cities = new Set<string>();

        findings.forEach(finding => {
          if (finding.pais) countries.add(finding.pais);
          if (finding.department) departments.add(finding.department);
          if (finding.city) cities.add(finding.city);
        });

        return {
          theme,
          findings,
          countries,
          departments,
          cities
        };
      });

      setThemeGroups(groups);
    } catch (err: any) {
      console.error('Error fetching theme groups:', err);
      setError(err.message || 'Error al obtener hallazgos por tema');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoDetect() {
    try {
      setDetecting(true);
      setError(null);
      const result = await autoDetectCoverages(projectId);
      setAutoDetectResult(result);
      
      // Refrescar los grupos después de la detección
      await fetchThemeGroups();
    } catch (err: any) {
      console.error('Error auto-detecting coverages:', err);
      setError(err.message || 'Error al detectar coberturas automáticamente');
    } finally {
      setDetecting(false);
    }
  }

  function toggleTheme(theme: string) {
    setExpandedTheme(expandedTheme === theme ? null : theme);
    if (showFindings === theme) {
      setShowFindings(null);
    }
  }

  function toggleFindings(theme: string) {
    setShowFindings(showFindings === theme ? null : theme);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <FiMapPin className="animate-spin w-4 h-4" /> Cargando coberturas por tema...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <FiAlertTriangle className="w-4 h-4" /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Coberturas por Tema</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({themeGroups.length} temas)
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchThemeGroups}
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleAutoDetect}
            disabled={detecting || themeGroups.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <FiZap className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Detectando...' : 'Detectar Automáticamente'}
          </Button>
        </div>
      </div>

      {/* Resultado de detección automática */}
      {autoDetectResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <FiZap className="w-4 h-4" />
              <strong>Detección Completada:</strong>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {autoDetectResult.message}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="font-medium">Temas procesados:</span> {autoDetectResult.themes_count}
              </div>
              <div>
                <span className="font-medium">Hallazgos analizados:</span> {autoDetectResult.cards_processed}
              </div>
              <div>
                <span className="font-medium text-green-700 dark:text-green-300">Nuevas creadas:</span> <span className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{autoDetectResult.created_count}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700 dark:text-blue-300">Existentes actualizadas:</span> <span className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">{autoDetectResult.updated_count || 0}</span>
              </div>
            </div>
            {autoDetectResult.errors && autoDetectResult.errors.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Avisos:</strong> {autoDetectResult.errors.length} elementos no pudieron procesarse
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grupos por tema */}
      {themeGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No se encontraron hallazgos con información geográfica.</p>
          <p className="text-sm">Los hallazgos aparecerán aquí cuando tengan datos de ubicación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {themeGroups.map((group) => (
            <Card key={group.theme} className="transition-all duration-200 hover:shadow-md">
              {/* Header del tema */}
              <button
                onClick={() => toggleTheme(group.theme)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white">
                      {group.theme}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                      {group.findings.length} hallazgos
                    </span>
                  </div>
                </div>
                <FiChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                    expandedTheme === group.theme ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Contenido expandido */}
              {expandedTheme === group.theme && (
                <CardContent className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Resumen geográfico */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Países</h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(group.countries).map((country) => (
                          <span key={country} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                            🌍 {country}
                          </span>
                        ))}
                        {group.countries.size === 0 && (
                          <span className="text-xs text-gray-400">Sin países identificados</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Departamentos</h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(group.departments).map((dept) => (
                          <span key={dept} className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                            🏛️ {dept}
                          </span>
                        ))}
                        {group.departments.size === 0 && (
                          <span className="text-xs text-gray-400">Sin departamentos identificados</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciudades</h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(group.cities).map((city) => (
                          <span key={city} className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
                            🏙️ {city}
                          </span>
                        ))}
                        {group.cities.size === 0 && (
                          <span className="text-xs text-gray-400">Sin ciudades identificadas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón para mostrar hallazgos */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFindings(group.theme)}
                      className="flex items-center gap-2"
                    >
                      <FiEye className="w-4 h-4" />
                      {showFindings === group.theme ? 'Ocultar Hallazgos' : 'Mostrar Hallazgos'}
                      <span className="text-xs">({group.findings.length})</span>
                    </Button>
                  </div>

                  {/* Lista de hallazgos */}
                  {showFindings === group.theme && (
                    <div className="space-y-2 max-h-60 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-4">
                      {group.findings.map((finding) => (
                        <div key={finding.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800 dark:text-white">
                              {finding.entity || 'Entidad sin nombre'}
                            </h5>
                            <div className="flex gap-1 text-xs">
                              {finding.pais && (
                                <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded">🌍 {finding.pais}</span>
                              )}
                              {finding.department && (
                                <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded">🏛️ {finding.department}</span>
                              )}
                              {finding.city && (
                                <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded">🏙️ {finding.city}</span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            {finding.description || finding.discovery || 'Sin descripción'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 