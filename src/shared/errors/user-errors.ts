export interface UserError {
  code: string
  title: string
  message: string
}

const entry = (code: string, title: string, message: string): UserError => ({ code, title, message })

export const errorCatalog: Record<string, UserError> = {
  UNAUTHORIZED: entry('SESION_REQUERIDA', 'Inicia sesión para continuar', 'Tu sesión no está disponible o ha vencido. Vuelve a iniciar sesión y reintenta la acción.'),
  INVALID_CREDENTIALS: entry('CREDENCIALES_INVALIDAS', 'No pudimos iniciar sesión', 'El correo o la contraseña no coinciden. Revisa tus datos e inténtalo de nuevo.'),
  ACCOUNT_CONFLICT: entry('CUENTA_EXISTENTE', 'Estos datos ya están en uso', 'El correo o el nombre de usuario ya están registrados. Usa otros datos o inicia sesión con tu cuenta.'),
  NETWORK: entry('SIN_CONEXION', 'No pudimos conectar', 'Comprueba tu conexión e inténtalo de nuevo. Si continúa, el servidor puede no estar disponible.'),
  FORBIDDEN: entry('SIN_PERMISO', 'No tienes permiso', 'Esta acción no está disponible para tu cuenta o tu rol actual.'),
  ROOM_NOT_FOUND: entry('SALA_NO_ENCONTRADA', 'No encontramos la sala', 'Revisa el código de la sala y vuelve a intentarlo.'),
  ROOM_FULL: entry('SALA_LLENA', 'La parrilla está completa', 'No quedan plazas en esta sala. Prueba con otra o crea una nueva.'),
  RACE_STARTED: entry('CARRERA_INICIADA', 'La carrera ya comenzó', 'Espera a que termine o únete a otra sala.'),
  HOST_REQUIRED: entry('SOLO_ANFITRION', 'Acción del anfitrión', 'Solo el anfitrión de la sala puede realizar esta acción.'),
  GENOME_REQUIRED: entry('PILOTO_REQUERIDO', 'Falta elegir un piloto', 'Todos los jugadores deben seleccionar un piloto NEAT entrenado antes de competir.'),
  PLAYERS_REQUIRED: entry('FALTAN_JUGADORES', 'Faltan pilotos', 'Se necesitan al menos dos jugadores para iniciar la carrera.'),
  NOT_READY: entry('PILOTOS_NO_LISTOS', 'La parrilla aún no está lista', 'Todos los jugadores deben confirmar que están listos.'),
  ALREADY_IN_ROOM: entry('SALA_ACTIVA', 'Ya estás en una sala', 'Sal de tu sala actual antes de crear otra o unirte a una nueva.'),
  NOT_IN_ROOM: entry('SIN_SALA', 'Primero entra a una sala', 'Crea una sala o introduce un código para unirte.'),
  INVALID_CAPACITY: entry('CAPACIDAD_INVALIDA', 'Revisa la capacidad', 'Escribe un número entero entre 2 y 64 jugadores.'),
  INVALID_SPEED: entry('VELOCIDAD_INVALIDA', 'Revisa la velocidad', 'Selecciona una velocidad de simulación de 1, 2 o 4.'),
  INVALID_STATE: entry('ESTADO_NO_VALIDO', 'Esta acción ya no está disponible', 'El estado de la sala o de la carrera cambió. Revisa la pantalla antes de intentarlo de nuevo.'),
  ROOM_CHANGED: entry('SALA_MODIFICADA', 'La sala cambió', 'Revisa los jugadores y la pista antes de volver a iniciar la carrera.'),
  STALE_RACE: entry('CARRERA_ANTERIOR', 'La carrera cambió', 'La acción corresponde a una carrera anterior. Selecciona de nuevo el auto.'),
  PLAYER_NOT_ACTIVE: entry('AUTO_INACTIVO', 'El auto ya no está activo', 'El piloto terminó o fue eliminado. Puedes seleccionar otro auto.'),
  TRAINING_NOT_FOUND: entry('ENTRENAMIENTO_NO_ENCONTRADO', 'No encontramos el entrenamiento', 'Actualiza la lista y selecciona un entrenamiento disponible.'),
  GENOME_UNAVAILABLE: entry('PILOTO_NO_DISPONIBLE', 'El piloto aún no está disponible', 'Completa y guarda una generación de entrenamiento antes de seleccionarlo.'),
  INCOMPATIBLE_TRAINING: entry('ENTRENAMIENTO_INCOMPATIBLE', 'Este entrenamiento no es compatible', 'Crea un entrenamiento nuevo con la versión actual del juego.'),
  INVALID_APPEARANCE: entry('AUTO_INVALIDO', 'Revisa la personalización', 'Revisa los colores y elige un número de parrilla entre 1 y 67.'),
  INVALID_DATA: entry('DATOS_INVALIDOS', 'Revisa los datos', 'Uno o más campos no son válidos. Comprueba los valores e inténtalo de nuevo.'),
  NOT_FOUND: entry('RECURSO_NO_ENCONTRADO', 'No encontramos lo solicitado', 'Actualiza la pantalla y vuelve a intentarlo.'),
  RATE_LIMIT: entry('DEMASIADAS_SOLICITUDES', 'Vamos un poco rápido', 'Espera unos instantes antes de volver a intentarlo.'),
  SERVER: entry('SERVIDOR_NO_DISPONIBLE', 'El servidor no pudo completar la acción', 'Espera unos instantes e inténtalo de nuevo.'),
  UNKNOWN: entry('ERROR_INESPERADO', 'No pudimos completar la acción', 'Inténtalo de nuevo. Si continúa, indica este código al informar del problema.'),
}

const rules: [RegExp, string][] = [
  [/invalid credentials/i, 'INVALID_CREDENTIALS'],
  [/authentication required|unauthorized|invalid session|jwt expired|sesión (?:cambió|no está|.*vencid)/i, 'UNAUTHORIZED'],
  [/email or username.*in use|already (?:registered|exists)/i, 'ACCOUNT_CONFLICT'],
  [/failed to fetch|fetch failed|networkerror|load failed|network request|no se pudo conectar/i, 'NETWORK'],
  [/room not found/i, 'ROOM_NOT_FOUND'], [/room is full/i, 'ROOM_FULL'],
  [/race has already started/i, 'RACE_STARTED'], [/only the host/i, 'HOST_REQUIRED'],
  [/trained genome|needs a genome/i, 'GENOME_REQUIRED'], [/at least two players/i, 'PLAYERS_REQUIRED'],
  [/every player must be ready/i, 'NOT_READY'], [/leave the current room/i, 'ALREADY_IN_ROOM'],
  [/join a room first/i, 'NOT_IN_ROOM'], [/race is not in lobby/i, 'INVALID_STATE'],
  [/training run not found|no se encontró el entrenamiento/i, 'TRAINING_NOT_FOUND'],
  [/(?:best|saved) genome is not available/i, 'GENOME_UNAVAILABLE'],
  [/unsupported.*(?:snapshot|version)|incompatible simulation|snapshot population|invalid guest (?:training|generation)/i, 'INCOMPATIBLE_TRAINING'],
  [/invalid vehicle appearance/i, 'INVALID_APPEARANCE'],
  [/database is not ready|internal server error|service unavailable/i, 'SERVER'],
  [/must be|should not|can only contain|bad request/i, 'INVALID_DATA'],
]

export function getUserError(error: unknown, fallback?: string): UserError {
  const source = typeof error === 'object' && error !== null ? error as { code?: unknown; message?: unknown; status?: unknown } : {}
  const message = typeof error === 'string' ? error : typeof source.message === 'string' ? source.message : ''
  if (typeof source.code === 'string' && errorCatalog[source.code]) return errorCatalog[source.code]
  const localized = Object.values(errorCatalog).find((item) => item.code === source.code || item.message === message)
  if (localized) return localized
  for (const [pattern, key] of rules) if (pattern.test(message)) return errorCatalog[key]
  if (typeof source.status === 'number') {
    const key = source.status >= 500 ? 'SERVER' : ({ 400: 'INVALID_DATA', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'ACCOUNT_CONFLICT', 422: 'INVALID_DATA', 429: 'RATE_LIMIT' } as Record<number, string>)[source.status]
    if (key) return errorCatalog[key]
  }
  // Only recognized Spanish UI messages may pass through; never expose arbitrary server diagnostics.
  if (/^(?:No se pud|No se encontr|La sesión|El garaje|El navegador|Este navegador|Revisa |Espera |Inicia sesión|Usa |Ingresa |Solo se permiten|La velocidad|La capacidad|La sala|Esta acción|Este auto|No hay )/.test(message)) {
    return entry('ACCION_NO_COMPLETADA', 'Revisa esta acción', message)
  }
  return fallback ? { ...errorCatalog.UNKNOWN, message: fallback } : errorCatalog.UNKNOWN
}

export function errorMessage(error: unknown, fallback?: string) {
  return getUserError(error, fallback).message
}
