export function crearDatosTicket(pedido, medioPago, vuelto = 0) {
  const productos = pedido.map(({ producto, cantidad }) => ({
    nombre: producto.nombre,
    cantidad,
    subtotal: producto.precio * cantidad
  }));
  const total = productos.reduce((suma, producto) => suma + producto.subtotal, 0);

  return {
    fecha: new Date().toISOString(),
    productos,
    total,
    medioPago,
    vuelto: medioPago === "efectivo" && vuelto > 0 ? vuelto : null
  };
}