const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduloPago = import(
  pathToFileURL(path.join(__dirname, "..", "js", "pago.mjs")).href
);

test("simula aprobación o rechazo para tarjeta y QR", async () => {
  const { simularPago } = await moduloPago;

  assert.deepEqual(simularPago("tarjeta", "aprobado"), {
    medio: "tarjeta",
    estado: "aprobado"
  });
  assert.deepEqual(simularPago("qr", "rechazado"), {
    medio: "qr",
    estado: "rechazado"
  });
});

test("devuelve null si el medio o el estado no son válidos", async () => {
  const { simularPago } = await moduloPago;

  assert.equal(simularPago(null, "aprobado"), null);
  assert.equal(simularPago("efectivo", "aprobado"), null);
  assert.equal(simularPago("tarjeta", "pendiente"), null);
});
