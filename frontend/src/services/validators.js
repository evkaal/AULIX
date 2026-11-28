// Validaciones reutilizables (login, registro, recuperación de contraseña).
// Cada función devuelve un mensaje de error o '' si el valor es válido.
// (Archivo del repo del compañero, sin cambios; se incluye aquí porque
// Registro.jsx lo usa y esta entrega solo trae los archivos cambiados.)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Al menos una mayúscula', test: (v) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  // El backend (RegisterRequest) exige minúscula con (?=.*[a-z]); sin esta
  // regla el formulario aceptaba "DOCENTE123*" y el servidor la rechazaba.
  { id: 'lower', label: 'Al menos una minúscula', test: (v) => /[a-záéíóúñ]/.test(v) },
  { id: 'number', label: 'Al menos un número', test: (v) => /\d/.test(v) },
  { id: 'special', label: 'Al menos un carácter especial', test: (v) => /[^A-Za-z0-9\sÁÉÍÓÚÑáéíóúñ]/.test(v) },
]

export function validateEmail(value) {
  if (!value.trim()) return 'El correo electrónico es obligatorio.'
  if (!EMAIL_REGEX.test(value.trim())) return 'Escribe un correo válido, por ejemplo nombre@colegio.edu.'
  return ''
}

/** Valida requisitos de seguridad completos (para registro / cambio de contraseña). */
export function validateStrongPassword(value) {
  if (!value) return 'La contraseña es obligatoria.'
  const failed = PASSWORD_RULES.filter((r) => !r.test(value))
  if (failed.length) return `La contraseña necesita: ${failed.map((r) => r.label.toLowerCase()).join(', ')}.`
  return ''
}

/** En el login solo se exige que no esté vacía (los requisitos se aplican al crearla). */
export function validateLoginPassword(value) {
  if (!value) return 'La contraseña es obligatoria.'
  return ''
}
/** Teléfono de México: 10 dígitos, solo números (se ignoran espacios y guiones). */
export function validateTelefono(value) {
  const digitos = (value ?? '').replace(/\D/g, '')
  if (!digitos) return 'El número de teléfono es obligatorio.'
  if (digitos.length !== 10) return 'El teléfono debe tener 10 dígitos, solo números.'
  return ''
}
