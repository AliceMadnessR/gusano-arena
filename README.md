# Gusano Arena

Juego PvP multijugador con salas y nombres. Servidor Node.js sin dependencias externas.

## Desarrollo

Ejecutar `npm start` y abrir http://localhost:3000. Usar dos pestañas con nombres distintos y la misma sala para probar PvP.

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
