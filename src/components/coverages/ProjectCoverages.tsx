import React, { useEffect, useState } from 'react';
import { FiMapPin, FiAlertTriangle, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { getCoverages, Coverage, CoverageType, formatCoverageName, getFindingsForCoverage, CapturadoCard } from '../../services/coverages';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface Props {
  projectId: string;
}

export default function ProjectCoverages({ projectId }: Props) {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoverages() {
      try {
        setLoading(true);
        setError(null);
        const result = await getCoverages(projectId);
        setCoverages(result.coverages);
      } catch (err: any) {
        console.error('Error fetching coverages:', err);
        setError(err.message || 'Error al obtener coberturas');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchCoverages();
    }
  }, [projectId, refreshKey]);

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
  }

  // Agrupar coberturas por tipo para una visualización ordenada
  const grouped: Record<CoverageType, Coverage[]> = coverages.reduce((acc, c) => {
    if (!acc[c.coverage_type]) acc[c.coverage_type] = [];
    acc[c.coverage_type].push(c);
    return acc;
  }, {} as Record<CoverageType, Coverage[]>);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <FiMapPin className="animate-spin w-4 h-4" /> Cargando coberturas...
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

  if (coverages.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400">No se encontraron coberturas para este proyecto.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" /> Refrescar
        </button>
      </div>

      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} className="space-y-2">
          <h3 className="text-lg font-semibold capitalize">{type}</h3>
          <div className="space-y-3">
            {list.map((coverage) => (
              <CoverageCard 
                key={coverage.id} 
                coverage={coverage} 
                projectId={projectId}
                isExpanded={expandedCard === coverage.id}
                onToggle={() => setExpandedCard(expandedCard === coverage.id ? null : coverage.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================================================================
// CoverageCard component
// ===================================================================

function CoverageCard({ 
  coverage, 
  projectId, 
  isExpanded, 
  onToggle 
}: { 
  coverage: Coverage; 
  projectId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [findings, setFindings] = useState<CapturadoCard[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function toggle() {
    if (!isExpanded && findings === null) {
      // Load findings first time
      try {
        setLoading(true);
        const data = await getFindingsForCoverage(projectId, coverage);
        setFindings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    onToggle();
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="truncate font-medium text-gray-800 dark:text-white">
          {formatCoverageName(coverage)}
        </span>
        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <CardContent className="border-t border-gray-200 dark:border-gray-700 p-4 text-sm animate-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <FiMapPin className="animate-spin w-4 h-4" /> Cargando hallazgos...
            </div>
          )}
          {!loading && findings && findings.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400">No se encontraron hallazgos asociados.</div>
          )}
          {!loading && findings && findings.length > 0 && (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {findings.map((f) => (
                <li key={f.id} className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <p className="font-medium text-gray-800 dark:text-white truncate">
                    {f.entity || 'Entidad sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {f.description || f.discovery || 'Sin descripción'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
} 