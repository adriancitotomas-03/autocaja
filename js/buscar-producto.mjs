export function buscarProducto(codigo, catalogo) {
  const codigoBuscado = codigo.trim();
  return catalogo.find((producto) => producto.codigo === codigoBuscado) ?? null;
}