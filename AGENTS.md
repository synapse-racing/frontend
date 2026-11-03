# Synapse Racing — frontend

## Contexto y arquitectura

Juego de carreras 3D con entrenamiento NEAT en el navegador, garaje y multijugador autoritativo en el backend. Flujo: inicio cinematográfico, acceso o invitado, paddock, entrenamiento y multijugador.

- Este archivo rige el repositorio. Las instrucciones del usuario tienen prioridad.
- Consulta código, package.json y README.md como referencia actual. docs/archive/ conserva planes históricos, no requisitos vigentes.
- Repositorio complementario habitual: ../synapse-backend. Comprueba su disponibilidad.
- Node.js 24 y pnpm según packageManager. Conserva pnpm-lock.yaml; no añadas lockfiles de otros gestores.

## Mapa del código

- src/app y src/pages: proveedores, navegación, recuperación de errores, inicio y paddock.
- src/features/auth: acceso, registro, sesión en memoria y modo invitado.
- src/features/garage: apariencia, garaje y persistencia.
- src/features/training/neat: genomas, mutación, especies y reproducción.
- src/features/training/domain y simulation: sensores, física, progreso y circuitos reproducibles.
- src/features/training/persistence: IndexedDB e importación de progreso del invitado.
- src/features/multiplayer: Socket.IO, salas, carreras e interpolación.
- src/shared/three: escenas, cámaras, materiales y rigs.
- src/shared/api, errors y components: peticiones y avisos de error comunes.
- scripts/vehicles: fuentes de modelos; public/models/vehicles: GLB y manifiesto activos.
- deploy/pterodactyl, Dockerfile y nginx.conf: despliegues.

## Reglas de implementación

- Mantén TypeScript estricto y la organización por funcionalidad. Evita dependencias y refactorizaciones ajenas a la tarea.
- Interfaz y errores visibles en español. Usa ErrorNotice y el catálogo de src/shared/errors; no imprimas excepciones del servidor en la interfaz. Documenta nuevos códigos cuando corresponda.
- Conserva la estética de videojuego y los componentes existentes. Revisa escritorio, ventanas bajas y móvil; evita scroll accidental y acciones ocultas.
- Controles accesibles mediante teclado, etiquetas y estados que no dependan solo del color. Confirma eliminaciones mediante diálogos accesibles.
- No actualices estado React por cada frame. Usa useFrame y refs para poses y animación.
- Libera recursos Three.js, audio, listeners y sockets al desmontar. Usa THREE.Timer en código nuevo; no reintroduzcas THREE.Clock.
- Genera modelos mediante scripts/vehicles. Conserva metadatos de ruedas, dirección, materiales y dorsales; regenera los GLB afectados al modificar las fuentes. Los modelos activos se versionan aunque sean generados.

## Invariantes del juego

- Evalúa genomas reales: ningún auto privilegiado ni conducción oculta que garantice terminar una generación.
- Circuitos cerrados y reproducibles por semilla, con salida y meta compartidas. Conserva compatibilidad explícita de versiones guardadas.
- Física, sensores, checkpoints, progreso y terminación deben coincidir con el backend. Al cambiar la simulación, revisa ambos contratos y ejecuta la prueba de paridad.
- El backend decide resultados y permisos multijugador; el cliente interpola snapshots.
- Salas de 2 a 64 jugadores. El selector de dorsal del garaje llega a 67; no confundas capacidad con dorsal y conserva compatibilidad de apariencias guardadas.
- Al terminar o eliminar el auto seguido, libera la cámara desde su última posición. Tras una carrera se vuelve a la sala existente.
- La aceleración modifica tiempo simulado. Los tiempos de vuelta no deben depender de FPS ni del reloj de pared.

## Sesión, datos y configuración

- Access token en memoria; renovación por cookie HttpOnly. No guardes tokens en localStorage ni registres contraseñas o cookies.
- Sesiones simultáneas permitidas. No reintroduzcas bloqueos globales ni por IP, navegador o cuenta sin una nueva solicitud explícita.
- Protege el progreso local del invitado en IndexedDB y su importación al autenticarse.
- API configurable mediante VITE_API_URL (por defecto /api). No hardcodees hosts de producción; respeta los proxies HTTP y Socket.IO de Vite y Nginx.
- No publiques .env, datos personales, bases de datos ni credenciales de hosting.

## Comprobación y entrega

- pnpm lint: análisis estático. pnpm build: TypeScript y bundle. pnpm test -- <ruta>: pruebas relevantes; pnpm test: suite completa.
- pnpm build:vehicles: regenera modelos. pnpm test:race-parity: compara con el backend; requiere ambos repositorios.
- Ejecuta comprobaciones proporcionales al cambio; prueba comportamiento y regresiones, no detalles triviales de implementación.
- Comunica fallos del entorno o previos; no los ocultes ni desactives validaciones para aprobar comprobaciones.
- Antes de borrar, confirma referencias y uso en runtime, scripts, Docker y CI. Conserva .env, datos y cambios del usuario; no uses git clean ni reset --hard.
- Temporales y exportaciones locales en tmp/ y exports/, excluidos de Git y Docker. No versionar ZIP del código, node_modules, dist, coverage o logs.
- Crea ramas cuando se solicite; usa feat/, fix/ o chore/, sin prefijo codex. Commits cortos en inglés con feat:, fix:, refactor:, chore: o docs:.
- Commit, push, despliegues y pruebas contra hosting solo dentro del alcance autorizado. Revisa el diff antes de preparar un commit.
- No generes informes extensos salvo solicitud. Resume cambios, comprobaciones y limitaciones.
