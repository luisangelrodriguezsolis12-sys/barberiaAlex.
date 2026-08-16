# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias:
- **Clientes**: hombres de 20 a 50 años que quieren agendar una cita (corte, barba, etc.) desde el celular sin llamar ni escribir, viendo horarios realmente disponibles.
- **Dueño de la barbería**: administra el sitio desde un panel admin protegido por contraseña — edita contenido, ve/gestiona citas y reseñas, y (en desarrollo) recibe notificaciones push cuando entra una reserva nueva.

## Product Purpose

Sitio de una sola página para Casa Negra Barbería. Permite a los clientes reservar una cita en línea con disponibilidad real, y le da al dueño una forma simple de operar el negocio sin depender de un desarrollador para cambios de contenido del día a día.

## Positioning

[Indefinido — no se ha declarado un diferenciador frente a otras barberías más allá de la experiencia de reserva en línea y la identidad visual editorial en blanco y negro. Abierto.]

## Operating Context

- Flujo de reserva por pasos: servicio → fecha → horario disponible → datos del cliente → confirmación (con opción de avisar por WhatsApp y agregar a Google Calendar).
- Panel admin (contraseña simple del lado del cliente, sin autenticación real) con tres pestañas: Contenido, Citas, Reseñas.
- Lista de espera (`waitlist`) cuando no hay horario disponible.

## Capabilities and Constraints

- Todo el contenido/datos vive en Firestore, consumido vía REST directo (sin SDK), no en tiempo real. Cada "clave" (bookings, waitlist, reviews, siteContent, siteMedia) es un documento en `site_data` con un solo campo `value` que contiene un array/objeto serializado en JSON — no son documentos individuales por registro.
- PWA instalable (`manifest.json` + service worker).
- Notificaciones push al dueño vía Firebase Cloud Messaging: en desarrollo activo (Cloud Function `notifyOwnerOnNewBooking`, dispara cuando cambia `site_data/bookings`).
- Integración con reseñas/calificación reales de Google Places/Maps: **pausada intencionalmente**, se retoma como fase aparte después del rediseño visual actual. Mientras tanto el sitio usa un sistema de reseñas propio (formulario interno), separado de las reseñas reales de Google.
- Backend: Cloud Functions (Firebase, `functions/index.js`). Frontend: HTML/CSS/JS plano en un solo archivo (`index.html`), sin framework ni build step.

## Brand Commitments

- Nombre: **Casa Negra Barbería**.
- Identidad visual: sobria, editorial, minimalista, en blanco y negro.
- Referencia visual vinculante dada explícitamente por el dueño: **barberiabarcelona.com** (ver Evidence on Hand). No es una sugerencia de estilo genérica — es la fuente de verdad para "premium" en este proyecto.
- "Premium" definido explícitamente por el dueño: NO significa dorado, lujo ostentoso ni gradientes. Significa refinar el minimalismo blanco y negro ya aplicado — mejor tipografía, mejor espaciado/jerarquía, microinteracciones sutiles (hover, transiciones de scroll de 140-220ms, nada "efectista").

## Evidence on Hand

- 9 capturas de pantalla reales de barberiabarcelona.com, revisadas directamente por el agente: `C:\Users\local_11t0d1v\OneDrive\Pictures\Screenshots\Captura de pantalla 2026-08-15 100059.png` a `...100226.png`. Muestran: fondo negro puro, headlines sans-serif geométricas gigantes, fotos verticales grandes con esquinas redondeadas (~24-32px), botones pill de borde delgado, badge de reseñas de Google ("EXCELENTE" + estrellas + conteo + logo Google), tarjetas de reseña individuales (avatar + nombre + fecha + estrellas + texto), secciones B/N dramáticas para CTAs, footer centrado con labels tenues e íconos circulares.
- Implementación actual completa y funcional en `index.html` (wizard de reservas, panel admin, sistema de reseñas propio) — es la base a refinar, no a reemplazar.
- No hay todavía datos reales de reseñas de Google integrados (fase futura, ver Capabilities and Constraints).

## Product Principles

1. Reservar una cita es la acción principal del sitio; ninguna mejora visual puede opacarla ni dificultarla.
2. La identidad es blanco y negro editorial/minimalista — no se introduce color, dorado ni ornamento, incluso bajo el pedido de sentirse "premium".
3. El dueño (usuario no técnico) debe poder seguir operando el sitio desde el panel admin sin fricción añadida.
4. Cualquier mejora visual preserva intacta toda la lógica funcional existente: scripts, funciones JS, `id`s, la lógica de Firestore, el wizard de reservas, el panel admin y el sistema de reseñas. Solo se toca CSS, estructura visual y animaciones de presentación.

## Accessibility & Inclusion

Estándar mínimo: **WCAG AA**. En concreto: contraste de texto suficiente, tamaños de fuente legibles, y estados de foco visibles en botones y campos del wizard de reservas. No se sacrifica legibilidad por estética.
