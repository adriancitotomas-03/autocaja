import { buscarProducto } from "./buscar-producto.mjs";
import { productos } from "./productos.mjs";
import { agregarProducto, pedido, quitarUnidad, vaciarCarrito } from "./carrito.mjs";
import { simularPago } from "./pago.mjs";
import { crearDatosTicket } from "./ticket.mjs";

const botonIniciarCompra = document.querySelector('[data-accion="iniciar-compra"]');
const pantallaBienvenida = document.querySelector("#pantalla-bienvenida");
const tituloBienvenida = document.querySelector("#titulo-bienvenida");
const pantallaEscaneo = document.querySelector("#pantalla-escaneo");
const terminal = document.querySelector("#terminal");
const progresoCompra = document.querySelector("#progreso-compra");
const tituloPedido = document.querySelector("#titulo-escaneo");
const formularioCodigo = document.querySelector("#formulario-codigo");
const campoCodigo = document.querySelector("#codigo-producto");
const botonEscanear = document.querySelector("#boton-escanear");
const resultadoBusqueda = document.querySelector("#resultado-busqueda");
const categoriasProductos = document.querySelector("#categorias-productos");
const catalogoProductos = document.querySelector("#catalogo-productos");
const carritoVacio = document.querySelector("#carrito-vacio");
const listaCarrito = document.querySelector("#lista-carrito");
const resumenCarrito = document.querySelector("#resumen-carrito");
const totalCarrito = document.querySelector("#total-carrito");
const botonContinuarPago = document.querySelector("#boton-continuar-pago");
const pantallaPago = document.querySelector("#pantalla-pago");
const totalPago = document.querySelector("#total-pago");
const tituloPago = document.querySelector("#titulo-pago");
const botonVolverCompra = document.querySelector("#boton-volver-compra");
const radiosMedioPago = document.querySelectorAll('input[name="medio-pago"]');
const postnetEspera = document.querySelector("#postnet-espera");
const postnetTarjeta = document.querySelector("#postnet-tarjeta");
const postnetQr = document.querySelector("#postnet-qr");
const postnetEfectivo = document.querySelector("#postnet-efectivo");
const postnetAprobado = document.querySelector("#postnet-aprobado");
const montoPostnet = document.querySelector("#monto-postnet");
const montoQrPostnet = document.querySelector("#monto-qr-postnet");
const panelEfectivo = document.querySelector("#panel-efectivo");
const importeRecibido = document.querySelector("#importe-recibido");
const estadoMedioPago = document.querySelector("#estado-medio-pago");
const botonConfirmarCobro = document.querySelector("#simular-pago-aprobado");
const botonSimularRechazo = document.querySelector("#simular-pago-rechazado");
const resultadoPago = document.querySelector("#resultado-pago");
const pantallaTicket = document.querySelector("#pantalla-ticket");
const tituloTicket = document.querySelector("#titulo-ticket");
const fechaTicket = document.querySelector("#fecha-ticket");
const listaTicket = document.querySelector("#lista-ticket");
const totalTicket = document.querySelector("#total-ticket");
const medioTicket = document.querySelector("#medio-ticket");
const vueltoTicket = document.querySelector("#vuelto-ticket");
const botonFinalizarCompra = document.querySelector("#boton-finalizar-compra");
const montoEfectivoPostnet = document.querySelector("#monto-efectivo-postnet");
const montoAprobadoPostnet = document.querySelector("#monto-aprobado-postnet");
const botonesCategoria = [];
let ventaFinalizada = false;
const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

function agregarProductoAlPedido(producto) {
  if (ventaFinalizada) {
    return;
  }

  agregarProducto(producto);
  renderizarCarrito();
  resultadoBusqueda.textContent = `${producto.nombre} agregado al pedido.`;
  resultadoBusqueda.dataset.tipo = "encontrado";
}

function renderizarCarrito() {
  listaCarrito.replaceChildren();

  pedido.forEach(({ producto, cantidad }) => {
    const linea = document.createElement("li");
    linea.className = "item-carrito";

    const nombre = document.createElement("span");
    nombre.textContent = producto.nombre;

    const detalle = document.createElement("span");
    detalle.className = "cantidad-carrito";
    detalle.textContent = `Cantidad: ${cantidad} · Subtotal: ${formatoPrecio.format(producto.precio * cantidad)}`;

    const botonQuitar = document.createElement("button");
    botonQuitar.type = "button";
    botonQuitar.className = "boton-quitar";
    botonQuitar.textContent = "Quitar";
    botonQuitar.setAttribute("aria-label", `Quitar una unidad de ${producto.nombre}`);
    botonQuitar.addEventListener("click", () => {
      if (ventaFinalizada) {
        return;
      }

      quitarUnidad(producto.codigo);
      renderizarCarrito();
    });

    linea.append(nombre, detalle, botonQuitar);
    listaCarrito.append(linea);
  });

  const total = pedido.reduce(
    (suma, { producto, cantidad }) => suma + producto.precio * cantidad,
    0
  );
  const hayProductos = pedido.length > 0;

  carritoVacio.hidden = hayProductos;
  listaCarrito.hidden = !hayProductos;
  resumenCarrito.hidden = !hayProductos;
  totalCarrito.textContent = formatoPrecio.format(total);
  botonContinuarPago.disabled = !hayProductos;
}

function continuarAlPago() {
  if (pedido.length === 0) {
    return;
  }

  totalPago.textContent = totalCarrito.textContent;
  pantallaEscaneo.hidden = true;
  pantallaPago.hidden = false;
  terminal.dataset.etapa = "cobro";
  tituloPago.focus();
}

function volverAlPedido() {
  pantallaPago.hidden = true;
  pantallaEscaneo.hidden = false;
  terminal.dataset.etapa = "pedido";
  tituloPedido.focus();
}

function iniciarCompra() {
  pantallaBienvenida.hidden = true;
  pantallaEscaneo.hidden = false;
  terminal.dataset.etapa = "pedido";
  progresoCompra.hidden = false;
  tituloPedido.focus();
}

function finalizarCompra() {
  vaciarCarrito();
  renderizarCarrito();
  ventaFinalizada = false;

  radiosMedioPago.forEach((radio) => {
    radio.checked = false;
  });
  importeRecibido.value = "";
  importeRecibido.disabled = true;
  panelEfectivo.hidden = true;
  estadoMedioPago.textContent = "Seleccioná un medio de pago.";
  resultadoBusqueda.textContent = "Caja lista. Agregá productos al pedido.";
  delete resultadoBusqueda.dataset.tipo;
  resultadoPago.textContent = "";
  delete resultadoPago.dataset.estado;
  totalPago.textContent = "$ 0";
  listaTicket.replaceChildren();
  fechaTicket.textContent = "";
  totalTicket.textContent = "";
  medioTicket.textContent = "";
  vueltoTicket.textContent = "";
  vueltoTicket.hidden = true;

  postnetEspera.hidden = false;
  postnetTarjeta.hidden = true;
  postnetQr.hidden = true;
  postnetEfectivo.hidden = true;
  postnetAprobado.hidden = true;
  montoPostnet.textContent = "$ 0";
  montoQrPostnet.textContent = "$ 0";
  montoEfectivoPostnet.textContent = "$ 0";
  montoAprobadoPostnet.textContent = "$ 0";

  pantallaTicket.hidden = true;
  pantallaPago.hidden = true;
  pantallaEscaneo.hidden = true;
  pantallaBienvenida.hidden = false;
  progresoCompra.hidden = true;
  terminal.dataset.etapa = "bienvenida";
  botonConfirmarCobro.disabled = true;
  botonSimularRechazo.disabled = true;
  tituloBienvenida.focus();
}

function mostrarEstadoPostnet(medioPago) {
  const estadosPostnet = [
    postnetEspera,
    postnetTarjeta,
    postnetQr,
    postnetEfectivo,
    postnetAprobado
  ];
  const estadoSeleccionado = {
    tarjeta: postnetTarjeta,
    qr: postnetQr,
    efectivo: postnetEfectivo
  }[medioPago];

  estadosPostnet.forEach((estado) => {
    estado.hidden = estado !== estadoSeleccionado;
  });

  if (medioPago === "tarjeta") {
    montoPostnet.textContent = totalPago.textContent;
  } else if (medioPago === "qr") {
    montoQrPostnet.textContent = totalPago.textContent;
  }

  const esEfectivo = medioPago === "efectivo";
  panelEfectivo.hidden = !esEfectivo;
  importeRecibido.disabled = !esEfectivo;
  const medioSimulado = medioPago === "tarjeta" || medioPago === "qr";
  botonConfirmarCobro.disabled = !medioSimulado;
  botonSimularRechazo.disabled = !medioSimulado;
  resultadoPago.textContent = "";
  delete resultadoPago.dataset.estado;

  if (esEfectivo) {
    actualizarImporteEfectivo();
  }
}

function actualizarImporteEfectivo() {
  const total = pedido.reduce(
    (suma, { producto, cantidad }) => suma + producto.precio * cantidad,
    0
  );
  const importe = Number(importeRecibido.value);

  if (!importeRecibido.value || !Number.isFinite(importe) || importe < total) {
    botonConfirmarCobro.disabled = true;
    estadoMedioPago.textContent = `El importe recibido debe ser igual o mayor al total de ${formatoPrecio.format(total)}.`;
    return;
  }

  const vuelto = importe - total;
  botonConfirmarCobro.disabled = false;
  estadoMedioPago.textContent = `Vuelto: ${formatoPrecio.format(vuelto)}.`;
}

function obtenerMedioSeleccionado() {
  return Array.from(radiosMedioPago).find((radio) => radio.checked);
}

function procesarSimulacion(estado) {
  const radioSeleccionado = obtenerMedioSeleccionado();
  const resultado = simularPago(radioSeleccionado?.value, estado);

  if (!resultado) {
    resultadoPago.textContent = "Seleccioná tarjeta o QR para simular el pago.";
    resultadoPago.dataset.estado = "rechazado";
    return;
  }

  if (resultado.estado === "rechazado") {
    resultadoPago.textContent = "Pago rechazado. Revisá el medio de pago e intentá nuevamente.";
    resultadoPago.dataset.estado = "rechazado";
    estadoMedioPago.textContent = "El pago fue rechazado. Podés volver a intentarlo.";
    return;
  }

  completarVenta(resultado.medio, 0);
}

function confirmarPagoEfectivo() {
  const radioSeleccionado = obtenerMedioSeleccionado();
  if (radioSeleccionado?.value !== "efectivo") {
    resultadoPago.textContent = "Seleccioná efectivo para confirmar este cobro.";
    resultadoPago.dataset.estado = "rechazado";
    return;
  }

  actualizarImporteEfectivo();
  if (botonConfirmarCobro.disabled) {
    return;
  }

  const total = pedido.reduce(
    (suma, { producto, cantidad }) => suma + producto.precio * cantidad,
    0
  );
  const vuelto = Number(importeRecibido.value) - total;
  montoEfectivoPostnet.textContent = formatoPrecio.format(Number(importeRecibido.value));
  completarVenta("efectivo", vuelto);
}

function completarVenta(medio, vuelto) {
  if (ventaFinalizada || pedido.length === 0) {
    return;
  }

  const datosTicket = crearDatosTicket(pedido, medio, vuelto);
  ventaFinalizada = true;
  listaTicket.replaceChildren();
  datosTicket.productos.forEach((producto) => {
    const linea = document.createElement("li");
    linea.className = "item-ticket";

    const descripcion = document.createElement("span");
    descripcion.textContent = `${producto.nombre} × ${producto.cantidad}`;

    const subtotal = document.createElement("strong");
    subtotal.textContent = formatoPrecio.format(producto.subtotal);

    linea.append(descripcion, subtotal);
    listaTicket.append(linea);
  });

  totalTicket.textContent = formatoPrecio.format(datosTicket.total);
  medioTicket.textContent = datosTicket.medioPago;
  fechaTicket.textContent = new Date(datosTicket.fecha).toLocaleString("es-AR");
  vueltoTicket.textContent = datosTicket.vuelto === null
    ? ""
    : `Vuelto: ${formatoPrecio.format(datosTicket.vuelto)}.`;
  vueltoTicket.hidden = datosTicket.vuelto === null;
  montoAprobadoPostnet.textContent = formatoPrecio.format(datosTicket.total);
  postnetEspera.hidden = true;
  postnetTarjeta.hidden = true;
  postnetQr.hidden = true;
  postnetEfectivo.hidden = true;
  postnetAprobado.hidden = false;
  botonConfirmarCobro.disabled = true;
  botonSimularRechazo.disabled = true;
  pantallaPago.hidden = true;
  pantallaTicket.hidden = false;
  terminal.dataset.etapa = "listo";
  tituloTicket.focus();
}

async function buscarProductoPorCodigo(evento) {
  evento.preventDefault();

  const codigo = campoCodigo.value.trim();
  const campoEstabaDeshabilitado = campoCodigo.disabled;
  const botonEstabaDeshabilitado = botonEscanear.disabled;

  formularioCodigo.setAttribute("aria-busy", "true");
  campoCodigo.disabled = true;
  botonEscanear.disabled = true;
  resultadoBusqueda.textContent = "Buscando producto...";
  resultadoBusqueda.dataset.tipo = "escaneando";

  try {
    await new Promise((resolver) => setTimeout(resolver, 0));
    const producto = buscarProducto(codigo, productos);

    if (!producto) {
      resultadoBusqueda.textContent = `No encontramos el producto con el código "${codigo}". Revisá el número e intentá de nuevo.`;
      resultadoBusqueda.dataset.tipo = "error";
      return;
    }

    agregarProductoAlPedido(producto);
  } catch (error) {
    console.error("No se pudo buscar el producto por código.", error);
    resultadoBusqueda.textContent = "No se pudo buscar el producto. Intentá nuevamente.";
    resultadoBusqueda.dataset.tipo = "error";
  } finally {
    formularioCodigo.setAttribute("aria-busy", "false");
    campoCodigo.disabled = campoEstabaDeshabilitado;
    botonEscanear.disabled = botonEstabaDeshabilitado;
  }
}

function mostrarCategoria(categoriaActiva) {
  botonesCategoria.forEach(({ boton, categoria }) => {
    const estaActiva = categoria === categoriaActiva;
    boton.classList.toggle("activo", estaActiva);
    boton.setAttribute("aria-pressed", String(estaActiva));
  });

  catalogoProductos.replaceChildren();
  const productosVisibles = categoriaActiva === null
    ? productos
    : productos.filter((producto) => producto.categoria === categoriaActiva);

  productosVisibles.forEach((producto) => {
    const tarjeta = document.createElement("button");
    tarjeta.type = "button";
    tarjeta.className = "tarjeta-producto";

    const icono = document.createElement("span");
    icono.className = "icono-producto";
    icono.setAttribute("aria-hidden", "true");
    icono.textContent = producto.icono;

    const nombre = document.createElement("span");
    nombre.className = "nombre-producto";
    nombre.textContent = producto.nombre;

    const precio = document.createElement("span");
    precio.className = "precio-producto";
    precio.textContent = formatoPrecio.format(producto.precio);

    tarjeta.append(icono, nombre, precio);
    tarjeta.addEventListener("click", () => agregarProductoAlPedido(producto));
    catalogoProductos.append(tarjeta);
  });
}

function renderizarCategorias() {
  const categorias = [...new Set(productos.map((producto) => producto.categoria))];
  const opciones = [null, ...categorias];

  opciones.forEach((categoria) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-categoria";
    boton.dataset.categoria = categoria ?? "";
    boton.textContent = categoria ?? "Todos";
    boton.addEventListener("click", () => mostrarCategoria(categoria));
    categoriasProductos.append(boton);
    botonesCategoria.push({ boton, categoria });
  });

  mostrarCategoria(null);
}

botonIniciarCompra.addEventListener("click", iniciarCompra);
formularioCodigo.addEventListener("submit", buscarProductoPorCodigo);
botonContinuarPago.addEventListener("click", continuarAlPago);
botonVolverCompra.addEventListener("click", volverAlPedido);
botonFinalizarCompra.addEventListener("click", finalizarCompra);
radiosMedioPago.forEach((radio) => {
  radio.addEventListener("change", () => mostrarEstadoPostnet(radio.value));
});
importeRecibido.addEventListener("input", actualizarImporteEfectivo);
botonConfirmarCobro.addEventListener("click", () => {
  const medioSeleccionado = obtenerMedioSeleccionado()?.value;
  if (medioSeleccionado === "efectivo") {
    confirmarPagoEfectivo();
  } else {
    procesarSimulacion("aprobado");
  }
});
botonSimularRechazo.addEventListener("click", () => procesarSimulacion("rechazado"));
renderizarCategorias();
renderizarCarrito();