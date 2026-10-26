# Gusano Arena

Juego PvP multijugador con salas y nombres. Servidor Node.js con WebSocket (`ws`).

## Desarrollo

Ejecutar `npm install` y después `npm start` y abrir http://localhost:3000. Usar dos pestañas con nombres distintos y la misma sala para probar PvP.

## Render

Crear un Web Service desde este repositorio: runtime Node, build `npm install`, start `npm start`, health check `/health`. Usar una sola instancia porque las salas se mantienen en memoria. Al reiniciar se pierden las partidas.

La página y el servidor funcionan en la misma URL de Render. Dejar vacío el campo Servidor de la partida. Todos los jugadores deben entrar a la misma sala.

## Reglas

- Cabeza contra cuerpo rival: muere quien choca.
- Cabeza contra cabeza: mueren ambos.
- Se puede cruzar el propio cuerpo. Los bordes matan.
- Comer aumenta el largo. Acelerar consume largo.
- Protección inicial frente a rivales durante 2,2 segundos.

Controles: mouse o dedo, WASD o flechas. Espacio o botón de rayo para acelerar.

## Rendimiento (v2)

- WebSocket persistente: 15 estados por segundo, sin esperar cada respuesta HTTP.
- Interpolación de rivales y predicción local con reconciliación; el servidor decide las colisiones.
- Comida enviada solo cuando cambia. Coordenadas compactas y un estado serializado por sala.
- Índice espacial para comida y colisiones. Canvas opaco, fondo y comida precalculados, culling y resolución limitada a 1,5x (adaptativa).
- Ranking actualizado como máximo 4 veces por segundo y solo reconstruido si cambió.
- Indicador de FPS/latencia; al ocultar la pestaña se reduce el trabajo.

`npm test` verifica reglas PvP, interpolación y movimiento independiente del refresco, conexiones WebSocket reales, aislamiento de salas, respawn y sincronización de comida.
