import express from 'express'
const app = express()
app.use(express.json()) 


// Middleware para leer el cuerpo de los POST
//─────────────────────────────────────────────────────────────────────────
// Evaluación 1 · API del Mundial 2026
// Diplomado IPS · Módulo 3 — Backend y APIs REST
//
// Este es tu punto de partida. Los DATOS ya están (datos-mundial.js): el resto
// lo escribes tú.
//
// ANTES DE EMPEZAR — instala lo que necesites. Por ejemplo:
//     npm install express
//     npm install cors
//
// Para levantar el servidor:
//     npm run dev        (se reinicia solo al guardar)
// ─────────────────────────────────────────────────────────────────────────────

// Recuerda el middleware que hace falta para leer el cuerpo de los POST,
// y configura CORS (lo vas a necesitar para el video).



// ─────────────────────────────────────────────────────────────────────────────
// TUS RUTAS
//
// Este es el mapa de lo que tienes que construir. El detalle completo de cada
// una (qué recibe, qué devuelve, qué status) está en el enunciado: léelo.
//
//  const express = require('express');
// ── BASE DE DATOS SIMULADA (En memoria) ───────────────────────────────────
let selecciones = [
  { id: 1, nombre: "Argentina", continente: "América", campeon: true, copas: ["1978", "1986", "2022"], partidosJugados: 7, golesFavor: 15 },
  { id: 2, nombre: "Francia", continente: "Europa", campeon: true, copas: ["1998", "2018"], partidosJugados: 7, golesFavor: 16 },
  { id: 3, nombre: "España", continente: "Europa", campeon: true, copas: ["2010"], partidosJugados: 7, golesFavor: 12 },
  { id: 4, nombre: "Marruecos", continente: "África", campeon: false, copas: [], partidosJugados: 7, golesFavor: 6 }
];

let torneo2026 = {
  semifinales: {}, // Guardará las llaves { "1": {...}, "2": {...} }
  final: null
};

// ── BASE ──────────────────────────────────────────────────────────────────

// GET /api/selecciones (con soporte para filtros de lógica)
app.get('/api/selecciones', (req, res) => {
  let resultado = [...selecciones];
  const { continente, campeon } = req.query;

  // GET /api/selecciones?continente=Europa
  if (continente) {
    resultado = resultado.filter(s => s.continente.toLowerCase() === continente.toLowerCase());
  }

  // GET /api/selecciones?campeon=true
  if (campeon) {
    const esCampeon = campeon === 'true';
    resultado = resultado.filter(s => s.campeon === esCampeon);
  }

  res.json(resultado);
});

// MAP: crea una lista resumida de selecciones
app.get('/api/selecciones/resumen', (req, res) => {
  const resumen = selecciones.map(seleccion => ({
    id: seleccion.id,
    nombre: seleccion.nombre,
    continente: seleccion.continente,
    cantidadCopas: seleccion.copas.length,
    golesFavor: seleccion.golesFavor
  }));

  res.json(resumen);
});

// GET /api/selecciones/:id
app.get('/api/selecciones/:id', (req, res) => {
  const seleccion = selecciones.find(s => s.id === parseInt(req.params.id));
  if (!seleccion) return res.status(404).json({ error: "Selección no encontrada" });
  res.json(seleccion);
});

// ── CON LÓGICA ⭐ ──────────────────────────────────────────────────────────
+
// GET /api/copas (Todas las copas en una lista plana)
app.get('/api/copas', (req, res) => {
  const todasLasCopas = selecciones.flatMap(s => s.copas);
  res.json(todasLasCopas);
});

// FLATMAP: relaciona cada copa con la selección que la ganó
app.get('/api/copas/detalle', (req, res) => {
  const copasDetalle = selecciones.flatMap(seleccion =>
    seleccion.copas.map(copa => ({
      seleccion: seleccion.nombre,
      continente: seleccion.continente,
      copa
    }))
  );

  res.json(copasDetalle);
});

// GET /api/copas/:seleccion (Copas por NOMBRE de la selección)
app.get('/api/copas/:seleccion', (req, res) => {
  const nombreBuscado = req.params.seleccion.toLowerCase();
  const seleccion = selecciones.find(s => s.nombre.toLowerCase() === nombreBuscado);
  
  if (!seleccion) return res.status(404).json({ error: "Selección no encontrada" });
  res.json(seleccion.copas);
});

// GET /api/estadisticas (Resumen del torneo)
app.get('/api/estadisticas', (req, res) => {
  const totalSelecciones = selecciones.length;
  const totalGoles = selecciones.reduce((sum, s) => sum + s.golesFavor, 0);
  const promedioGoles = totalSelecciones > 0 ? (totalGoles / totalSelecciones).toFixed(2) : 0;

  res.json({
    totalSelecciones,
    totalGoles,
    promedioGolesPorEquipo: parseFloat(promedioGoles)
  });
});

// ── SEMIFINALES Y FINAL ⭐ ─────────────────────────────────────────────────

// POST /api/worldcup/2026/semifinals/:n (Registra la semifinal n del 1 al 4)
app.post('/api/worldcup/2026/semifinals/:n', (req, res) => {
  const n = req.params.n;
  if (!['1', '2', '3', '4'].includes(n)) {
    return res.status(400).json({ error: "Número de semifinal inválido. Debe ser de 1 a 4." });
  }

  // Ejemplo de body esperado: { "equipo1": "Argentina", "equipo2": "Francia", "score": "2-1", "ganador": "Argentina" }
  const { equipo1, equipo2, score, ganador } = req.body;
  if (!equipo1 || !equipo2 || !score || !ganador) {
    return res.status(400).json({ error: "Faltan datos del partido en el body" });
  }

  torneo2026.semifinales[n] = { equipo1, equipo2, score, ganador };
  res.status(201).json({ mensaje: `Semifinal ${n} registrada con éxito`, datos: torneo2026.semifinales[n] });
});

// GET /api/worldcup/2026/semifinals (Las cuatro)
// Se coloca arriba de /:n para que Express no confunda la palabra "semifinals" con un parámetro id
app.get('/api/worldcup/2026/semifinals', (req, res) => {
  res.json(torneo2026.semifinales);
});

// GET /api/worldcup/2026/semifinals/:n (El resultado de la semifinal n)
app.get('/api/worldcup/2026/semifinals/:n', (req, res) => {
  const n = req.params.n;
  const resultadoSemi = torneo2026.semifinales[n];
  
  if (!resultadoSemi) return res.status(404).json({ error: `La semifinal ${n} aún no ha sido registrada` });
  res.json(resultadoSemi);
});

// POST /api/worldcup/2026/final (Registra la final)
app.post('/api/worldcup/2026/final', (req, res) => {
  // Ejemplo de body esperado: { "equipo1": "Argentina", "equipo2": "España", "score": "3-2", "ganador": "Argentina" }
  const { equipo1, equipo2, score, ganador } = req.body;
  if (!equipo1 || !equipo2 || !score || !ganador) {
    return res.status(400).json({ error: "Faltan datos de la final en el body" });
  }

  torneo2026.final = { equipo1, equipo2, score, ganador };
  res.status(201).json({ mensaje: "Final registrada con éxito", datos: torneo2026.final });
});

// GET /api/worldcup/2026/final (La final con su ganador)
app.get('/api/worldcup/2026/final', (req, res) => {
  if (!torneo2026.final) return res.status(404).json({ error: "La final aún no ha sido registrada" });
  res.json(torneo2026.final);
});

// ── INICIO DEL SERVIDOR ───────────────────────────────────────────────────
// BÚSQUEDA ENTRE ENTIDADES: partidos de una selección en el torneo 2026
app.get('/api/selecciones/:nombre/partidos', (req, res) => {
  const nombre = req.params.nombre.toLowerCase();
  const semifinales = Object.entries(torneo2026.semifinales).map(([numero, partido]) => ({
    fase: `Semifinal ${numero}`,
    ...partido
  }));
  const partidos = torneo2026.final
    ? [...semifinales, { fase: 'Final', ...torneo2026.final }]
    : semifinales;
  const resultado = partidos.filter(partido =>
    partido.equipo1.toLowerCase() === nombre ||
    partido.equipo2.toLowerCase() === nombre
  );

  res.json(resultado);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
