const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function prepararAplicacion(productos = []) {
  const manejadores = {};
  const productoAgregado = [];
  const pedido = [];
  let tituloEnfocado = false;
  let tituloBienvenidaEnfocado = false;
  let tituloPagoEnfocado = false;
  let tituloTicketEnfocado = false;
  const radiosMedioPago = ["efectivo", "tarjeta", "qr"].map((valor) => ({
    value: valor,
    checked: false,
    addEventListener(tipo, manejador) {
      this.manejadores = this.manejadores || {};
      this.manejadores[tipo] = manejador;
    }
  }));
  function crearElemento(etiqueta) {
    const clases = new Set();
    return {
      etiqueta,
      children: [],
      atributos: {},
      dataset: {},
      classList: {
        add(clase) {
          clases.add(clase);
        },
        contains(clase) {
          return clases.has(clase);
        },
        toggle(clase, activo) {
          if (activo) {
            clases.add(clase);
          } else {
            clases.delete(clase);
          }
          return activo;
        }
      },
      addEventListener(tipo, manejador) {
        this.manejadores = this.manejadores || {};
        this.manejadores[tipo] = manejador;
      },
      append(...elementos) {
        this.children.push(...elementos);
      },
      replaceChildren(...elementos) {
        this.children = [...elementos];
      },
      setAttribute(nombre, valor) {
        this.atributos[nombre] = valor;
      }
    };
  }
  const elementos = {
    '[data-accion="iniciar-compra"]': {
      addEventListener(tipo, manejador) {
        manejadores.iniciarCompra = manejador;
      }
    },
    "#pantalla-bienvenida": { hidden: false },
    "#titulo-bienvenida": {
      focus() {
        tituloBienvenidaEnfocado = true;
      }
    },
    "#pantalla-escaneo": { hidden: true },
    "#terminal": { dataset: { etapa: "bienvenida" } },
    "#progreso-compra": { hidden: true },
    "#titulo-escaneo": {
      focus() {
        tituloEnfocado = true;
      }
    },
    "#titulo-pago": {
      focus() {
        tituloPagoEnfocado = true;
      }
    },
    "#titulo-ticket": {
      focus() {
        tituloTicketEnfocado = true;
      }
    },
    "#boton-finalizar-compra": {
      addEventListener(tipo, manejador) {
        this.manejadores = this.manejadores || {};
        this.manejadores[tipo] = manejador;
      }
    },
    "#pantalla-pago": { hidden: true },
    "#pantalla-ticket": { hidden: true },
    "#total-pago": { textContent: "$ 0" },
    "#postnet-espera": { hidden: false },
    "#postnet-tarjeta": { hidden: true },
    "#postnet-qr": { hidden: true },
    "#postnet-efectivo": { hidden: true },
    "#postnet-aprobado": { hidden: true },
    "#monto-postnet": { textContent: "$ 0" },
    "#monto-qr-postnet": { textContent: "$ 0" },
    "#monto-efectivo-postnet": { textContent: "$ 0" },
    "#monto-aprobado-postnet": { textContent: "$ 0" },
    "#resultado-pago": { textContent: "", dataset: {} },
    "#lista-ticket": crearElemento("ul"),
    "#total-ticket": { textContent: "" },
    "#medio-ticket": { textContent: "" },
    "#fecha-ticket": { textContent: "" },
    "#vuelto-ticket": { textContent: "", hidden: true },
    "#panel-efectivo": { hidden: true },
    "#importe-recibido": {
      value: "",
      disabled: true,
      addEventListener(tipo, manejador) {
        this.manejadores = this.manejadores || {};
        this.manejadores[tipo] = manejador;
      }
    },
    "#estado-medio-pago": { textContent: "Seleccioná un medio de pago." },
    "#simular-pago-aprobado": {
      disabled: true,
      addEventListener(tipo, manejador) {
        this.manejadores = this.manejadores || {};
        this.manejadores[tipo] = manejador;
      }
    },
    "#simular-pago-rechazado": {
      disabled: true,
      addEventListener(tipo, manejador) {
        this.manejadores = this.manejadores || {};
        this.manejadores[tipo] = manejador;
      }
    },
    "#boton-continuar-pago": {
      disabled: true,
      addEventListener(tipo, manejador) {
        manejadores.continuarPago = manejador;
      }
    },
    "#boton-volver-compra": {
      addEventListener(tipo, manejador) {
        manejadores.volverCompra = manejador;
      }
    },
    "#formulario-codigo": {
      atributos: {},
      addEventListener(tipo, manejador) {
        manejadores[tipo] = manejador;
      },
      setAttribute(nombre, valor) {
        this.atributos[nombre] = valor;
      }
    },
    "#codigo-producto": { value: "", disabled: false },
    "#boton-escanear": { disabled: false },
    "#resultado-busqueda": { textContent: "", dataset: {} },
    "#categorias-productos": crearElemento("nav"),
    "#catalogo-productos": crearElemento("div"),
    "#carrito-vacio": { hidden: false },
    "#lista-carrito": Object.assign(crearElemento("ul"), { hidden: true }),
    "#resumen-carrito": { hidden: true },
    "#total-carrito": { textContent: "$ 0" }
  };
  const codigo = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8")
    .replace(/^import .+;\r?\n/gm, "");
  const contexto = {
    document: {
      querySelector(selector) {
        return elementos[selector];
      },
      querySelectorAll(selector) {
        assert.equal(selector, 'input[name="medio-pago"]');
        return radiosMedioPago;
      },
      createElement(etiqueta) {
        return crearElemento(etiqueta);
      }
    },
    buscarProducto(codigo, catalogo) {
      return catalogo.find((producto) => producto.codigo === codigo) ?? null;
    },
    simularPago(medio, estado) {
      return ["tarjeta", "qr"].includes(medio) && ["aprobado", "rechazado"].includes(estado)
        ? { medio, estado }
        : null;
    },
    crearDatosTicket(pedidoConfirmado, medioPago, vuelto) {
      const productosTicket = pedidoConfirmado.map(({ producto, cantidad }) => ({
        nombre: producto.nombre,
        cantidad,
        subtotal: producto.precio * cantidad
      }));
      return {
        fecha: "2026-11-18T12:00:00.000Z",
        productos: productosTicket,
        total: productosTicket.reduce((suma, producto) => suma + producto.subtotal, 0),
        medioPago,
        vuelto: medioPago === "efectivo" && vuelto > 0 ? vuelto : null
      };
    },
    productos,
    agregarProducto(producto) {
      productoAgregado.push(producto);
      const linea = pedido.find((item) => item.producto.codigo === producto.codigo);
      if (linea) {
        linea.cantidad += 1;
      } else {
        pedido.push({ producto, cantidad: 1 });
      }
    },
    pedido,
    vaciarCarrito() {
      pedido.length = 0;
    },
    quitarUnidad(codigo) {
      const indice = pedido.findIndex((linea) => linea.producto.codigo === codigo);
      if (indice === -1) return;
      pedido[indice].cantidad -= 1;
      if (pedido[indice].cantidad === 0) pedido.splice(indice, 1);
    },
    setTimeout
  };

  vm.runInNewContext(codigo, contexto);

  return {
    elementos,
    manejadores,
    radiosMedioPago,
    productoAgregado,
    pedido,
    tituloEnfocado: () => tituloEnfocado,
    tituloBienvenidaEnfocado: () => tituloBienvenidaEnfocado,
    tituloPagoEnfocado: () => tituloPagoEnfocado,
    tituloTicketEnfocado: () => tituloTicketEnfocado
  };
}

test("iniciar una compra muestra el pedido y enfoca su título", () => {
  const { elementos, manejadores, tituloEnfocado } = prepararAplicacion();

  manejadores.iniciarCompra();

  assert.equal(elementos["#pantalla-bienvenida"].hidden, true);
  assert.equal(elementos["#pantalla-escaneo"].hidden, false);
  assert.equal(elementos["#terminal"].dataset.etapa, "pedido");
  assert.equal(elementos["#progreso-compra"].hidden, false);
  assert.equal(tituloEnfocado(), true);
});

test("el formulario agrega el producto encontrado y restaura los controles", async () => {
  const producto = { codigo: "779001", nombre: "Café" };
  const { elementos, manejadores, productoAgregado } = prepararAplicacion([producto]);
  let envioPrevenido = false;

  elementos["#codigo-producto"].value = " 779001 ";
  const busqueda = manejadores.submit({
    preventDefault() {
      envioPrevenido = true;
    }
  });

  assert.equal(envioPrevenido, true);
  assert.equal(elementos["#formulario-codigo"].atributos["aria-busy"], "true");
  assert.equal(elementos["#codigo-producto"].disabled, true);
  assert.equal(elementos["#boton-escanear"].disabled, true);
  assert.equal(elementos["#resultado-busqueda"].textContent, "Buscando producto...");

  await busqueda;

  assert.deepEqual(productoAgregado, [producto]);
  assert.equal(elementos["#resultado-busqueda"].textContent, "Café agregado al pedido.");
  assert.equal(elementos["#resultado-busqueda"].dataset.tipo, "encontrado");
  assert.equal(elementos["#formulario-codigo"].atributos["aria-busy"], "false");
  assert.equal(elementos["#codigo-producto"].disabled, false);
  assert.equal(elementos["#boton-escanear"].disabled, false);
});

test("el formulario informa cuando el código no existe", async () => {
  const { elementos, manejadores, productoAgregado } = prepararAplicacion([]);
  elementos["#codigo-producto"].value = "779999";

  await manejadores.submit({ preventDefault() {} });

  assert.equal(productoAgregado.length, 0);
  assert.match(elementos["#resultado-busqueda"].textContent, /779999/);
  assert.equal(elementos["#resultado-busqueda"].dataset.tipo, "error");
  assert.equal(elementos["#formulario-codigo"].atributos["aria-busy"], "false");
  assert.equal(elementos["#codigo-producto"].disabled, false);
  assert.equal(elementos["#boton-escanear"].disabled, false);
});

test("muestra categorías y filtra las tarjetas con estado accesible", () => {
  const productos = [
    { codigo: "779001", categoria: "Cafetería", icono: "☕", nombre: "Café", precio: 1800 },
    { codigo: "779002", categoria: "Pastelería", icono: "🥐", nombre: "Medialuna", precio: 1200 },
    { codigo: "779003", categoria: "Cafetería", icono: "🥛", nombre: "Café con leche", precio: 2200 }
  ];
  const { elementos } = prepararAplicacion(productos);
  const botones = elementos["#categorias-productos"].children;

  assert.deepEqual(botones.map((boton) => boton.textContent), [
    "Todos",
    "Cafetería",
    "Pastelería"
  ]);
  assert.equal(botones[0].atributos["aria-pressed"], "true");
  assert.equal(botones[0].classList.contains("activo"), true);
  assert.equal(elementos["#catalogo-productos"].children.length, 3);

  botones[1].manejadores.click();

  assert.equal(botones[0].atributos["aria-pressed"], "false");
  assert.equal(botones[0].classList.contains("activo"), false);
  assert.equal(botones[1].atributos["aria-pressed"], "true");
  assert.equal(botones[1].classList.contains("activo"), true);
  assert.equal(elementos["#catalogo-productos"].children.length, 2);

  const tarjeta = elementos["#catalogo-productos"].children[0];
  assert.equal(tarjeta.etiqueta, "button");
  assert.equal(tarjeta.className, "tarjeta-producto");
  assert.deepEqual(tarjeta.children.map((parte) => parte.textContent), [
    "☕",
    "Café",
    "$ 1.800"
  ]);
});

test("al activar una tarjeta agrega el producto y mantiene abierto el pedido", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, manejadores, productoAgregado } = prepararAplicacion([producto]);
  manejadores.iniciarCompra();

  const tarjeta = elementos["#catalogo-productos"].children[0];
  tarjeta.manejadores.click();

  assert.deepEqual(productoAgregado, [producto]);
  assert.equal(elementos["#resultado-busqueda"].textContent, "Café agregado al pedido.");
  assert.equal(elementos["#resultado-busqueda"].dataset.tipo, "encontrado");
  assert.equal(elementos["#pantalla-escaneo"].hidden, false);
  assert.equal(elementos["#pantalla-bienvenida"].hidden, true);
});

test("muestra cantidades, subtotales y total, y los actualiza al quitar unidades", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, manejadores } = prepararAplicacion([producto]);
  const tarjeta = elementos["#catalogo-productos"].children[0];

  tarjeta.manejadores.click();
  tarjeta.manejadores.click();

  const linea = elementos["#lista-carrito"].children[0];
  assert.equal(elementos["#carrito-vacio"].hidden, true);
  assert.equal(elementos["#lista-carrito"].hidden, false);
  assert.equal(elementos["#resumen-carrito"].hidden, false);
  assert.equal(linea.children[0].textContent, "Café");
  assert.equal(linea.children[1].textContent, "Cantidad: 2 · Subtotal: $ 3.600");
  assert.equal(elementos["#total-carrito"].textContent, "$ 3.600");

  linea.children[2].manejadores.click();
  assert.equal(elementos["#lista-carrito"].children[0].children[1].textContent,
    "Cantidad: 1 · Subtotal: $ 1.800");
  assert.equal(elementos["#total-carrito"].textContent, "$ 1.800");

  elementos["#lista-carrito"].children[0].children[2].manejadores.click();
  assert.equal(elementos["#carrito-vacio"].hidden, false);
  assert.equal(elementos["#lista-carrito"].hidden, true);
  assert.equal(elementos["#resumen-carrito"].hidden, true);
  assert.equal(elementos["#total-carrito"].textContent, "$ 0");
});

test("no permite avanzar al pago con el carrito vacío", () => {
  const { elementos, manejadores } = prepararAplicacion();
  manejadores.iniciarCompra();

  assert.equal(elementos["#boton-continuar-pago"].disabled, true);
  manejadores.continuarPago();

  assert.equal(elementos["#pantalla-escaneo"].hidden, false);
  assert.equal(elementos["#pantalla-pago"].hidden, true);
  assert.equal(elementos["#terminal"].dataset.etapa, "pedido");
});

test("avanza al pago con productos y vuelve al pedido sin perderlos", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, manejadores, pedido, tituloPagoEnfocado } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();

  assert.equal(elementos["#boton-continuar-pago"].disabled, false);
  manejadores.continuarPago();

  assert.equal(elementos["#total-pago"].textContent, "$ 1.800");
  assert.equal(elementos["#pantalla-escaneo"].hidden, true);
  assert.equal(elementos["#pantalla-pago"].hidden, false);
  assert.equal(elementos["#terminal"].dataset.etapa, "cobro");
  assert.equal(tituloPagoEnfocado(), true);

  manejadores.volverCompra();

  assert.equal(elementos["#pantalla-pago"].hidden, true);
  assert.equal(elementos["#pantalla-escaneo"].hidden, false);
  assert.equal(elementos["#terminal"].dataset.etapa, "pedido");
  assert.deepEqual(pedido, [{ producto, cantidad: 1 }]);
  assert.equal(elementos["#lista-carrito"].children[0].children[0].textContent, "Café");
});

test("muestra el estado del Postnet según el medio de pago seleccionado", () => {
  const { elementos, radiosMedioPago } = prepararAplicacion();
  elementos["#total-pago"].textContent = "$ 4.200";

  radiosMedioPago.find((radio) => radio.value === "tarjeta")
    .manejadores.change();
  assert.equal(elementos["#postnet-tarjeta"].hidden, false);
  assert.equal(elementos["#monto-postnet"].textContent, "$ 4.200");
  assert.equal(elementos["#postnet-qr"].hidden, true);
  assert.equal(elementos["#postnet-efectivo"].hidden, true);
  assert.equal(elementos["#postnet-espera"].hidden, true);
  assert.equal(elementos["#postnet-aprobado"].hidden, true);

  radiosMedioPago.find((radio) => radio.value === "qr")
    .manejadores.change();
  assert.equal(elementos["#postnet-tarjeta"].hidden, true);
  assert.equal(elementos["#postnet-qr"].hidden, false);
  assert.equal(elementos["#monto-qr-postnet"].textContent, "$ 4.200");
  assert.equal(elementos["#postnet-efectivo"].hidden, true);

  radiosMedioPago.find((radio) => radio.value === "efectivo")
    .manejadores.change();
  assert.equal(elementos["#postnet-tarjeta"].hidden, true);
  assert.equal(elementos["#postnet-qr"].hidden, true);
  assert.equal(elementos["#postnet-efectivo"].hidden, false);
  assert.equal(elementos["#postnet-espera"].hidden, true);
  assert.equal(elementos["#postnet-aprobado"].hidden, true);
});

test("no confirma efectivo cuando el importe recibido es insuficiente", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 4200
  };
  const { elementos, radiosMedioPago } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#total-pago"].textContent = "$ 4.200";
  elementos["#importe-recibido"].value = "4199";

  radiosMedioPago.find((radio) => radio.value === "efectivo")
    .manejadores.change();
  elementos["#importe-recibido"].manejadores.input();

  assert.equal(elementos["#panel-efectivo"].hidden, false);
  assert.equal(elementos["#importe-recibido"].disabled, false);
  assert.equal(elementos["#simular-pago-aprobado"].disabled, true);
  assert.match(elementos["#estado-medio-pago"].textContent, /igual o mayor/);
});

test("habilita confirmar efectivo exacto e indica vuelto cero", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 4200
  };
  const { elementos, radiosMedioPago } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#total-pago"].textContent = "$ 4.200";
  elementos["#importe-recibido"].value = "4200";

  radiosMedioPago.find((radio) => radio.value === "efectivo")
    .manejadores.change();
  elementos["#importe-recibido"].manejadores.input();

  assert.equal(elementos["#simular-pago-aprobado"].disabled, false);
  assert.equal(elementos["#estado-medio-pago"].textContent, "Vuelto: $ 0.");
});

test("habilita confirmar y calcula el vuelto cuando sobra efectivo", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 4200
  };
  const { elementos, radiosMedioPago } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#total-pago"].textContent = "$ 4.200";
  elementos["#importe-recibido"].value = "5000";

  radiosMedioPago.find((radio) => radio.value === "efectivo")
    .manejadores.change();
  elementos["#importe-recibido"].manejadores.input();

  assert.equal(elementos["#simular-pago-aprobado"].disabled, false);
  assert.equal(elementos["#estado-medio-pago"].textContent, "Vuelto: $ 800.");
});

test("un pago rechazado mantiene abierta la venta y permite otro intento", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, radiosMedioPago } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#boton-continuar-pago"].manejadores.click();
  const radioTarjeta = radiosMedioPago.find((radio) => radio.value === "tarjeta");
  radioTarjeta.checked = true;
  radioTarjeta.manejadores.change();

  elementos["#simular-pago-rechazado"].manejadores.click();

  assert.equal(elementos["#resultado-pago"].dataset.estado, "rechazado");
  assert.match(elementos["#resultado-pago"].textContent, /intentá nuevamente/);
  assert.equal(elementos["#pantalla-pago"].hidden, false);
  assert.equal(elementos["#pantalla-ticket"].hidden, true);
  assert.equal(elementos["#lista-ticket"].children.length, 0);
  assert.equal(elementos["#simular-pago-aprobado"].disabled, false);
  assert.equal(elementos["#simular-pago-rechazado"].disabled, false);
});

test("una aprobación muestra el Postnet aprobado y avanza al comprobante", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, radiosMedioPago, pedido, tituloTicketEnfocado } =
    prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#boton-continuar-pago"].manejadores.click();
  const radioQr = radiosMedioPago.find((radio) => radio.value === "qr");
  radioQr.checked = true;
  radioQr.manejadores.change();

  elementos["#simular-pago-aprobado"].manejadores.click();

  assert.equal(elementos["#postnet-aprobado"].hidden, false);
  assert.equal(elementos["#monto-aprobado-postnet"].textContent, "$ 1.800");
  assert.equal(elementos["#pantalla-pago"].hidden, true);
  assert.equal(elementos["#pantalla-ticket"].hidden, false);
  assert.equal(elementos["#terminal"].dataset.etapa, "listo");
  assert.equal(elementos["#medio-ticket"].textContent, "qr");
  assert.equal(elementos["#total-ticket"].textContent, "$ 1.800");
  assert.equal(elementos["#lista-ticket"].children.length, 1);
  assert.equal(elementos["#lista-ticket"].children[0].children[0].textContent, "Café × 1");
  assert.equal(elementos["#lista-ticket"].children[0].children[1].textContent, "$ 1.800");
  assert.match(elementos["#fecha-ticket"].textContent, /18\/11\/2026/);
  assert.equal(elementos["#vuelto-ticket"].hidden, true);
  assert.equal(tituloTicketEnfocado(), true);
  assert.equal(elementos["#simular-pago-aprobado"].disabled, true);

  elementos["#catalogo-productos"].children[0].manejadores.click();
  assert.deepEqual(pedido, [{ producto, cantidad: 1 }]);
});

test("el efectivo se confirma con el importe recibido sin rechazo bancario", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const { elementos, radiosMedioPago } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#boton-continuar-pago"].manejadores.click();
  const radioEfectivo = radiosMedioPago.find((radio) => radio.value === "efectivo");
  radioEfectivo.checked = true;
  elementos["#importe-recibido"].value = "2000";
  radioEfectivo.manejadores.change();

  assert.equal(elementos["#simular-pago-rechazado"].disabled, true);
  elementos["#simular-pago-aprobado"].manejadores.click();

  assert.equal(elementos["#pantalla-ticket"].hidden, false);
  assert.equal(elementos["#medio-ticket"].textContent, "efectivo");
  assert.equal(elementos["#monto-efectivo-postnet"].textContent, "$ 2.000");
  assert.equal(elementos["#vuelto-ticket"].hidden, false);
  assert.equal(elementos["#vuelto-ticket"].textContent, "Vuelto: $ 200.");
  assert.equal(elementos["#resultado-pago"].dataset.estado, undefined);
});

test("finalizar una venta reinicia el estado y permite iniciar otra limpia", () => {
  const producto = {
    codigo: "779001",
    categoria: "Cafetería",
    icono: "☕",
    nombre: "Café",
    precio: 1800
  };
  const {
    elementos,
    radiosMedioPago,
    tituloBienvenidaEnfocado
  } = prepararAplicacion([producto]);
  elementos["#catalogo-productos"].children[0].manejadores.click();
  elementos["#boton-continuar-pago"].manejadores.click();
  const radioTarjeta = radiosMedioPago.find((radio) => radio.value === "tarjeta");
  radioTarjeta.checked = true;
  radioTarjeta.manejadores.change();
  elementos["#simular-pago-aprobado"].manejadores.click();

  elementos["#boton-finalizar-compra"].manejadores.click();

  assert.equal(elementos["#terminal"].dataset.etapa, "bienvenida");
  assert.equal(elementos["#pantalla-bienvenida"].hidden, false);
  assert.equal(elementos["#pantalla-escaneo"].hidden, true);
  assert.equal(elementos["#pantalla-pago"].hidden, true);
  assert.equal(elementos["#pantalla-ticket"].hidden, true);
  assert.equal(elementos["#progreso-compra"].hidden, true);
  assert.equal(tituloBienvenidaEnfocado(), true);
  assert.deepEqual(elementos["#lista-carrito"].children, []);
  assert.equal(elementos["#carrito-vacio"].hidden, false);
  assert.equal(elementos["#total-carrito"].textContent, "$ 0");
  assert.equal(elementos["#boton-continuar-pago"].disabled, true);
  assert.equal(radiosMedioPago.some((radio) => radio.checked), false);
  assert.equal(elementos["#importe-recibido"].value, "");
  assert.equal(elementos["#importe-recibido"].disabled, true);
  assert.equal(elementos["#panel-efectivo"].hidden, true);
  assert.equal(elementos["#estado-medio-pago"].textContent, "Seleccioná un medio de pago.");
  assert.equal(elementos["#resultado-busqueda"].textContent, "Caja lista. Agregá productos al pedido.");
  assert.equal(elementos["#resultado-busqueda"].dataset.tipo, undefined);
  assert.equal(elementos["#resultado-pago"].textContent, "");
  assert.equal(elementos["#lista-ticket"].children.length, 0);
  assert.equal(elementos["#fecha-ticket"].textContent, "");
  assert.equal(elementos["#total-ticket"].textContent, "");
  assert.equal(elementos["#medio-ticket"].textContent, "");
  assert.equal(elementos["#vuelto-ticket"].hidden, true);
  assert.equal(elementos["#postnet-espera"].hidden, false);
  assert.equal(elementos["#postnet-aprobado"].hidden, true);
  assert.equal(elementos["#monto-aprobado-postnet"].textContent, "$ 0");

  elementos["[data-accion=\"iniciar-compra\"]"].manejadores.iniciarCompra();

  assert.equal(elementos["#terminal"].dataset.etapa, "pedido");
  assert.equal(elementos["#pantalla-bienvenida"].hidden, true);
  assert.equal(elementos["#pantalla-escaneo"].hidden, false);
  assert.equal(elementos["#total-carrito"].textContent, "$ 0");
  assert.equal(elementos["#lista-carrito"].children.length, 0);

  elementos["#catalogo-productos"].children[0].manejadores.click();
  assert.equal(elementos["#total-carrito"].textContent, "$ 1.800");
  assert.equal(elementos["#lista-carrito"].children.length, 1);
});
