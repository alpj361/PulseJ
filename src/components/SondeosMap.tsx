import React from 'react';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow, HeatmapLayer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 14.634915, // Centro de Guatemala
  lng: -90.506882
};

export interface Sondeo {
  id: string;
  lat: number;
  lng: number;
  zona?: string;
  lugar?: string;
  municipio?: string;
  departamento?: string;
  pregunta: string;
  created_at: string;
}

interface SondeosMapProps {
  sondeos: Sondeo[];
}

const SondeosMap: React.FC<SondeosMapProps> = ({ sondeos }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places', 'visualization'] // Unificado para evitar errores de carga múltiple
  });

  const [selected, setSelected] = React.useState<Sondeo | null>(null);
  const [filtroZona, setFiltroZona] = React.useState<string>('');
  const [filtroDepto, setFiltroDepto] = React.useState<string>('');
  const [modoHeatmap, setModoHeatmap] = React.useState(false);

  // Extraer zonas y departamentos únicos
  const zonas = Array.from(new Set(sondeos.map(s => s.zona).filter(Boolean))) as string[];
  const deptos = Array.from(new Set(sondeos.map(s => s.departamento).filter(Boolean))) as string[];

  // Filtrar sondeos según los selects
  const sondeosFiltrados = sondeos.filter(s =>
    (filtroZona ? s.zona === filtroZona : true) &&
    (filtroDepto ? s.departamento === filtroDepto : true)
  );

  // Datos para el heatmap
  const heatmapData = sondeosFiltrados.map(s => ({ location: new window.google.maps.LatLng(s.lat, s.lng), weight: 1 }));

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
        <label>
          Zona:
          <select value={filtroZona} onChange={e => setFiltroZona(e.target.value)} style={{ marginLeft: 8 }}>
            <option value=''>Todas</option>
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <label>
          Departamento:
          <select value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)} style={{ marginLeft: 8 }}>
            <option value=''>Todos</option>
            {deptos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="checkbox" checked={modoHeatmap} onChange={e => setModoHeatmap(e.target.checked)} />
          <span style={{ marginLeft: 6 }}>Ver como Heatmap</span>
        </label>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        {!modoHeatmap && sondeosFiltrados.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            onClick={() => setSelected(s)}
          />
        ))}
        {!modoHeatmap && selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <strong>{selected.lugar || selected.zona || selected.municipio || 'Ubicación'}</strong>
              <br />
              <span><b>Pregunta:</b> {selected.pregunta}</span>
              <br />
              <span><b>Fecha:</b> {selected.created_at.slice(0, 10)}</span>
              <br />
              {selected.departamento && <span><b>Departamento:</b> {selected.departamento}</span>}
            </div>
          </InfoWindow>
        )}
        {modoHeatmap && heatmapData.length > 0 && (
          <HeatmapLayer data={heatmapData} />
        )}
      </GoogleMap>
    </div>
  );
};

export default SondeosMap; 