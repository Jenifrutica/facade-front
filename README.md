# AURUM — Frontend del Sistema de Reservas de Hotel

Interfaz web del caso de estudio *Sistema de Reservas de Hotel*, construida con
**React + Vite + TypeScript + Tailwind CSS v4 + Motion**. Consume la API del
backend (patrón **Facade**) y toda la interfaz está en espanol.

En vivo: **<https://aurum.jenilarper.dev>**.

Créditos de fotografías (vía Wikimedia Commons): fachada "Hotel Infante Sagres,
Porto" por Dale Cruse (CC BY 4.0); suite "Canopy bed of Amantaka Suite" por Basile
Morin (CC BY-SA 4.0); habitación "Hotel Flor Guest Room" por Evolve&Co (CC BY-SA 4.0);
"Tropical Noir Chic Boutique Hotel Room in Lisbon" por Dale Cruse (CC BY 4.0).

---

## 1. Caso de estudio

Un hotel necesita un sistema digital de reservas. La operación interna (gestión de
habitaciones, tarifas dinámicas por temporada, servicios adicionales, facturación y
llaves digitales) vive en el backend detrás de un `HotelFacade`. Este frontend es el
cliente: nunca conoce los subsistemas, solo la interfaz sencilla que expone la fachada.

Todos los montos se muestran en **pesos colombianos (COP)**.

---

## 2. Flujo de la interfaz

1. **Autenticación** — registro e inicio de sesión con validadores y botón *ojito*
   para ver/ocultar la contraseña.
2. **Buscador de habitaciones** — por fechas y tipo (sencilla, doble, suite), con
   visualización de disponibilidad y **precio dinámico** según temporada.
3. **Selección de habitación** — tarjetas por tipo con el precio total calculado.
4. **Formulario de reserva** — datos del huésped, con validación en vivo.
5. **Panel de gestión** — agregar servicios (spa, desayuno, traslado), ver resumen,
   hacer **check-in** (emite llave digital UUID) y **check-out**.
6. **Factura final** — desglose generado por el servidor.

---

## 3. Validadores y seguridad

- **Nombre**: obligatorio, minimo 3 caracteres.
- **Correo**: formato validado en cliente y servidor.
- **Contrasena**: minimo 8 caracteres, una mayuscula, una minuscula y un numero,
  con barra de fortaleza. Boton de vista (ojo) para mostrar/ocultar.
- **Confirmacion**: debe coincidir con la contrasena.
- Las contrasenas se almacenan **encriptadas con BCrypt** en el backend.
- La sesion usa un token Bearer guardado en `localStorage`.

---

## 4. Identidad visual

Dirección de arte **"The dark room"**: un solo campo negro de arriba a abajo y, dentro,
cosas iluminadas. Tipografia **Bodoni Moda** (display) + **Jost** (texto), con un unico
acento **dorado**. Paneles de vidrio, transiciones tipo spring de *Motion* y soporte de
`prefers-reduced-motion`.

---

## 5. Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173 (proxy /api -> localhost:8080)
npm run build    # tsc + vite build
npm run preview
```

Variable opcional:

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API | vacío (usa `/api` relativo, proxied por nginx) |

---

## 6. Despliegue

Se construye como imagen Docker (multi-stage: Node → nginx) y se despliega junto al
backend en **AWS Lightsail Container Service**. nginx sirve el SPA y hace proxy de
`/api/` hacia el contenedor del backend (`BACKEND_HOST`/`BACKEND_PORT`).

Ver la configuración DNS y de dominio en la seccion de despliegue.
