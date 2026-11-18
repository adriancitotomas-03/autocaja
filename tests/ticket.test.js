const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduloTicket = import(
  pathToFileURL(path.join(__dirname, "..", "js", "ticket.mjs")).href
);
const pedido = [
  { producto: { nombre: "Café", precio: 1800 }, cantidad: 2 },
  { producto: { nombre: "Medialuna", precio: 1200 }, cantidad: 1 }
];

test("crea datos de comprobante con fecha, subtotales y total", async () => {
  const { crearDatosTicket } = await moduloTicket;
  const ticket = crearDatosTicket(pedido, "tarjeta");

  assert.equal(Number.isNaN(Date.parse(ticket.fecha)), false);
  assert.deepEqual(ticket.productos, [
    { nombre: "Café", cantidad: 2, subtotal: 3600 },
    { nombre: "Medialuna", cantidad: 1, subtotal: 1200 }
  ]);
  assert.equal(ticket.total, 4800);
  assert.equal(ticket.medioPago, "tarjeta");
  assert.equal(ticket.vuelto, null);
});

test("incluye el vuelto solo cuando corresponde a un pago en efectivo", async () => {
  const { crearDatosTicket } = await moduloTicket;

  assert.equal(crearDatosTicket(pedido, "efectivo", 200).vuelto, 200);
  assert.equal(crearDatosTicket(pedido, "efectivo", 0).vuelto, null);
  assert.equal(crearDatosTicket(pedido, "qr", 200).vuelto, null);
});
