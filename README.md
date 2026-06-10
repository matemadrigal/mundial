# 🏆 La Porra Mundial · WC26

Porra del Mundial 2026 para 4 amigos: calendario en vivo, predicciones
(resultado, córners, tarjetas, campeón y pichichi) y clasificación
automática. Next.js + Supabase + API-Football, desplegada en Vercel.

## Puesta en marcha (15 min)

### 1. Supabase (base de datos, gratis)
1. Crea un proyecto en supabase.com
2. SQL Editor → pega `supabase-schema.sql` entero → Run
   (ya incluye los 4 jugadores con sus contraseñas)
3. Settings → API → copia `Project URL` y `service_role` key

### 2. API-Football (datos de partidos, gratis)
1. Regístrate en dashboard.api-sports.io (no en RapidAPI)
2. Copia tu API key
3. *Nota:* si el plan Free no diera acceso a la temporada 2026,
   el plan Pro ($19/mes) sí; el código es idéntico.

### 3. Variables de entorno en Vercel
Project → Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | service_role key |
| `APIFOOTBALL_KEY` | tu key de api-sports |
| `SESSION_SECRET` | cadena aleatoria larga |
| `SYNC_SECRET` | otra cadena aleatoria |

Después: Deployments → Redeploy.

### 4. Primera carga de datos
Entra con tu contraseña de admin → pestaña **Admin (Sala VAR)** →
**🌍 Sync completo**. Eso carga los 104 partidos del torneo.

### 5. Tiempo real (opcional pero recomendado)
El sync "perezoso" ya actualiza datos cuando alguien usa la web.
Para refresco aunque nadie la abra, crea un cron gratis en cron-job.org:
- URL: `https://TU-APP.vercel.app/api/sync?mode=light&secret=TU_SYNC_SECRET`
- Frecuencia: cada 15 min (puedes limitarlo a las horas de partidos)

El cron diario de Vercel (4:00 UTC, en `vercel.json`) hace un sync
completo de respaldo que añade los cruces de eliminatorias nuevos.

## Cómo funciona por dentro

- **Login**: una contraseña por jugador (normalizada: sin tildes ni
  mayúsculas). Cookie firmada HMAC, 60 días.
- **Anti-trampas**: el servidor rechaza predicciones tras el kickoff;
  las predicciones ajenas solo se revelan cuando el partido empieza.
- **Sync**: `light` (hoy±1, ~2-9 requests) / `full` (todo el torneo,
  1 request + stats). Candado de 90 s y throttle de 8 min. Presupuesto
  típico: 30-60 requests/día de las 100 gratuitas (cuota visible en Admin).
- **Puntos**: `lib/scoring.js` es la única fuente de verdad. Cualquier
  cambio de reglas → "Recalcular" desde Admin (sync con `recalc=1`).
- **Correcciones**: el admin puede fijar resultados a mano; ese partido
  queda protegido frente al sync (`manual_override`).

## Problemas típicos

- *"Sin partidos aún"* → falta `APIFOOTBALL_KEY` o falta pulsar Sync completo.
- *Error de seasons en sync* → el plan Free no incluye 2026: sube a Pro.
- *Córners/tarjetas vacíos* → la API tarda unos minutos tras el pitido
  final; el siguiente sync los trae. O métellos a mano en Admin.
- *Cambiar contraseñas/usuarios* → tabla `users` en Supabase.
