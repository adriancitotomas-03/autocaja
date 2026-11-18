const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduloBusqueda = import(
  pathToFileURL(path.join(__dirname, "..", "js", "buscar-producto.mjs")).href
);
const catalogo = [
  { codigo: "779001", nombre: "Café" },
  { codigo: "779002", nombre: "Té" }
];

test("devuelve el producto cuando encuentra el código", async () => {
  const { buscarProducto } = await moduloBusqueda;

  assert.equal(buscarProducto("779002", catalogo), catalogo[1]);
});

test("quita los espacios alrededor del código antes de buscar", async () => {
  const { buscarProducto } = await moduloBusqueda;

  assert.equal(buscarProducto("  779001  ", catalogo), catalogo[0]);
});

test("devuelve null cuando el código no existe", async () => {
  const { buscarProducto } = await moduloBusqueda;

  assert.equal(buscarProducto("779999", catalogo), null);
});
