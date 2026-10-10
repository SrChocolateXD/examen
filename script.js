"use strict";

const paginas = [...document.querySelectorAll(".pagina")];
const botonesIndice = [...document.querySelectorAll(".indice button")];

const anterior = document.getElementById("anterior");
const siguiente = document.getElementById("siguiente");
const contador = document.getElementById("contador");
const progreso = document.getElementById("progreso");
const estadoVoz = document.getElementById("estado-voz");

const tieneVoz =
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

let paginaActual = 0;
let narracionActual = null;
let versionLectura = 0;

function detenerLectura() {
  versionLectura++;

  if (tieneVoz) {
    window.speechSynthesis.cancel();
  }

  narracionActual = null;
  estadoVoz.textContent = "";
}

function mostrarPagina(numero) {
  if (numero < 0 || numero >= paginas.length) {
    return;
  }

  detenerLectura();
  paginaActual = numero;

  paginas.forEach((pagina, indice) => {
    const activa = indice === paginaActual;

    pagina.classList.toggle("activa", activa);
    pagina.hidden = !activa;
  });

  botonesIndice.forEach((boton, indice) => {
    if (indice === paginaActual) {
      boton.setAttribute("aria-current", "page");
    } else {
      boton.removeAttribute("aria-current");
    }
  });

  contador.textContent = `${paginaActual + 1} / ${paginas.length}`;

  progreso.style.width =
    `${((paginaActual + 1) / paginas.length) * 100}%`;

  anterior.disabled = paginaActual === 0;
  siguiente.disabled = paginaActual === paginas.length - 1;
}

function escucharPagina(indice) {
  if (!tieneVoz) {
    estadoVoz.textContent =
      "Este navegador no dispone de síntesis de voz.";
    return;
  }

  detenerLectura();

  const texto = paginas[indice]
    .querySelector(".narracion")
    .textContent
    .replace(/\s+/g, " ")
    .trim();

  const locucion = new SpeechSynthesisUtterance(texto);
  const version = versionLectura;

  locucion.lang = "es-PE";
  locucion.rate = 0.9;
  locucion.pitch = 1;
  locucion.volume = 1;

  const voces = window.speechSynthesis.getVoices();

  const vozEspanol =
    voces.find(voz => /^es[-_]PE$/i.test(voz.lang)) ||
    voces.find(voz => /^es[-_]/i.test(voz.lang));

  if (vozEspanol) {
    locucion.voice = vozEspanol;
    locucion.lang = vozEspanol.lang;
  }

  locucion.onstart = () => {
    if (version !== versionLectura) return;

    estadoVoz.textContent =
      `Reproduciendo sección ${indice + 1}…`;
  };

  locucion.onend = () => {
    if (version !== versionLectura) return;

    estadoVoz.textContent = "Lectura finalizada.";
    narracionActual = null;
  };

  locucion.onerror = evento => {
    if (version !== versionLectura) return;

    if (
      evento.error === "canceled" ||
      evento.error === "interrupted"
    ) {
      return;
    }

    estadoVoz.textContent =
      "No se pudo reproducir la voz. Comprueba las voces del dispositivo.";
    narracionActual = null;
  };

  // Conservar la referencia durante la reproducción.
  narracionActual = locucion;
  window.speechSynthesis.speak(locucion);
}

anterior.addEventListener("click", () => {
  mostrarPagina(paginaActual - 1);
});

siguiente.addEventListener("click", () => {
  mostrarPagina(paginaActual + 1);
});

botonesIndice.forEach((boton, indice) => {
  boton.addEventListener("click", () => {
    mostrarPagina(indice);
  });
});

paginas.forEach((pagina, indice) => {
  pagina.querySelector(".escuchar").addEventListener("click", () => {
    escucharPagina(indice);
  });

  pagina.querySelector(".detener").addEventListener("click", () => {
    detenerLectura();
  });
});

document.addEventListener("keydown", evento => {
  const elemento = evento.target;

  // Evitar interferir con controles o campos de escritura.
  if (
    elemento instanceof Element &&
    elemento.closest("input, textarea, select, button, [contenteditable]")
  ) {
    return;
  }

  if (evento.key === "ArrowRight") {
    evento.preventDefault();
    mostrarPagina(paginaActual + 1);
  }

  if (evento.key === "ArrowLeft") {
    evento.preventDefault();
    mostrarPagina(paginaActual - 1);
  }
});

window.addEventListener("pagehide", detenerLectura);

if (!tieneVoz) {
  document.querySelectorAll(".escuchar, .detener").forEach(boton => {
    boton.disabled = true;
  });

  estadoVoz.textContent =
    "La lectura sintética no está disponible en este navegador.";
}

mostrarPagina(0);