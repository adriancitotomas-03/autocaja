const mediosSimulados = ["tarjeta", "qr"];
const estadosPago = ["aprobado", "rechazado"];

export function simularPago(medio, estado) {
  if (!mediosSimulados.includes(medio) || !estadosPago.includes(estado)) {
    return null;
  }

  return { medio, estado };
}