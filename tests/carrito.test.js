const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduloCarrito = import(
  pathToFileURL(path.join(__dirname, "..", "js", "carrito.mjs")).href
);
const cafe = { codigo: "779001", nombre: "Café", precio: 1800 };
const te = { codigo: "779002", nombre: "Té", precio: 1500 };

test("agrega productos al carrito con cantidad inicial uno", async () => {
  const { pedido, agregarProducto, vaciarCarrito } = await moduloCarrito;
  vaciarCarrito();

  agregarProducto(cafe);

  assert.deepEqual(pedido, [{ producto: cafe, cantidad: 1 }]);
});

test("incrementa la cantidad si agrega un código existente", async () => {
  const { pedido, agregarProducto, vaciarCarrito } = await moduloCarrito;
  vaciarCarrito();

  agregarProducto(cafe);
  agregarProducto({ ...cafe, nombre: "Café actualizado" });

  assert.equal(pedido.length, 1);
  assert.equal(pedido[0].cantidad, 2);
  assert.equal(pedido[0].producto, cafe);
});

test("quita una unidad y elimina la línea cuando llega a cero", async () => {
  const { pedido, agregarProducto, quitarUnidad, vaciarCarrito } = await moduloCarrito;
  vaciarCarrito();
  agregarProducto(cafe);
  agregarProducto(cafe);

  quitarUnidad(cafe.codigo);
  assert.equal(pedido.length, 1);
  assert.equal(pedido[0].cantidad, 1);

  quitarUnidad(cafe.codigo);
  assert.deepEqual(pedido, []);
});

test("no altera el carrito al quitar un código inexistente", async () => {
  const { pedido, agregarProducto, quitarUnidad, vaciarCarrito } = await moduloCarrito;
  vaciarCarrito();
  agregarProducto(cafe);

  quitarUnidad("779999");

  assert.deepEqual(pedido, [{ producto: cafe, cantidad: 1 }]);
});

test("vacía todas las líneas del carrito", async () => {
  const { pedido, agregarProducto, vaciarCarrito } = await moduloCarrito;
  vaciarCarrito();
  agregarProducto(cafe);
  agregarProducto(te);

  vaciarCarrito();

  assert.deepEqual(pedido, []);
});
