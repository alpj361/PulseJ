import { SessionNavBar } from "./sidebar";

export function SidebarDemo() {
  return (
    <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto ml-12">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Nuevo Sidebar Demo</h1>
          <p className="text-gray-600 mb-4">
            El sidebar se expande al hacer hover y se contrae automáticamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2">✨ Características</h3>
              <ul className="space-y-1 text-sm">
                <li>• Expansión/contracción automática</li>
                <li>• Estructura organizada por secciones</li>
                <li>• Soporte para modo oscuro</li>
                <li>• Badges para funciones próximas</li>
                <li>• Navegación activa</li>
                <li>• Menús dropdown</li>
              </ul>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2">🗂️ Secciones</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Social Pulse:</strong> Trends, News</li>
                <li>• <strong>Personal Pulse:</strong> Actividad, Sondeos</li>
                <li>• <strong>My Pulse:</strong> Codex, Proyectos</li>
                <li>• <strong>Coming Soon:</strong> Sources, Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 