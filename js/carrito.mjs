export const pedido = [];

export function agregarProducto(producto) {
  const lineaExistente = pedido.find((linea) => linea.producto.codigo === producto.codigo);

  if (lineaExistente) {
    lineaExistente.cantidad += 1;
    return;
  }

  pedido.push({ producto, cantidad: 1 });
}

export function quitarUnidad(codigo) {
  const indiceLinea = pedido.findIndex((linea) => linea.producto.codigo === codigo);

  if (indiceLinea === -1) {
    return;
  }

  pedido[indiceLinea].cantidad -= 1;

  if (pedido[indiceLinea].cantidad === 0) {
    pedido.splice(indiceLinea, 1);
  }
}

export function vaciarCarrito() {
  pedido.length = 0;
}