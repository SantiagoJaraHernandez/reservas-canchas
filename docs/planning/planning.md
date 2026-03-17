# 📋 Planning del Proyecto — Sistema de Reservas de Canchas Deportivas

**Institución:** CORHUILA — Corporación Universitaria del Huila  
**Asignatura:** Sistemas Distribuidos — Semestre 2026-1  
**Docente:** Jesús Ariel González Bonilla

---

## 📁 Repositorios del Proyecto

| Repositorio | Descripción | Responsable | Tecnología |
|-------------|-------------|-------------|------------|
| [reservas-canchas-api](https://github.com/SantiagoJaraHernandez/reservas-canchas-api) | Backend — Microservicios REST | Santiago | Java 17 + Spring Boot |
| [reservas-canchas-portal](https://github.com/SantiagoJaraHernandez/reservas-canchas-portal) | Frontend — Interfaz web | Sneyder | React + Vite + Tailwind |
| [reservas-canchas-db](https://github.com/SantiagoJaraHernandez/reservas-canchas-db) | Base de datos — Scripts y modelos | Nelson | PostgreSQL + MongoDB |

---

## 👥 Equipo

| Integrante | Rol | Responsabilidades |
|------------|-----|-------------------|
| **Santiago** | Backend Lead | Microservicios, Gateway, Autenticación, Pagos, Reportes |
| **Sneyder** | Frontend Lead | Portal React, vistas, rutas protegidas, dashboard |
| **Nelson** | DBA | Scripts SQL, diagramas ERD, seeds, colecciones MongoDB |
| **Oscar** | DevOps | Docker, CI/CD, despliegue en Railway |
| **Iván** | PM | Trello, seguimiento de tareas, documentación |

---

## 🏗️ Arquitectura del Sistema

```
Frontend React (:5173)
        │
        ▼
   API Gateway (:8080)
        │
        ├──► ms-reservas (:8081) ──► PostgreSQL
        ├──► ms-auth     (:8082) ──► MongoDB
        ├──► ms-pagos    (:8083) ──► MongoDB
        ├──► ms-notif    (:8084) ──► MongoDB
        └──► ms-reportes (:8085) ──► Agrega datos
```

### Microservicios

| Microservicio | Puerto | Base de Datos | Release | Estado |
|--------------|--------|---------------|---------|--------|
| gateway | 8080 | — | Release 1 | ✅ Implementado |
| ms-reservas | 8081 | PostgreSQL | Release 1 | ✅ Implementado |
| ms-auth | 8082 | MongoDB | Release 2 | ✅ Implementado |
| ms-pagos | 8083 | MongoDB | Release 3 | ⏳ Pendiente |
| ms-notificaciones | 8084 | MongoDB | Release 3 | ⏳ Pendiente |
| ms-reportes | 8085 | Agrega datos | Release 3 | ⏳ Pendiente |
| portal (React) | 5173 | — | Release 1 | 🔄 En curso |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Uso |
|------|------------|-----|
| Backend | Java 17 + Spring Boot 3.x | Todos los microservicios |
| API Gateway | Spring WebFlux | Enrutamiento reactivo y filtro JWT |
| Frontend | React + Vite + Tailwind CSS | Interfaz de usuario |
| BD Relacional | PostgreSQL 15 | ms-reservas (canchas y reservas) |
| BD NoSQL | MongoDB 7 | ms-auth, ms-pagos, ms-notificaciones |
| Migraciones | Flyway | Versionado del esquema PostgreSQL |
| Autenticación | JWT (JJWT 0.12.6) | Seguridad y autorización |
| Contenedores | Docker + Docker Compose | Despliegue completo |
| CI/CD | GitHub Actions | Pipeline de build en PRs |
| Control de versiones | GitHub (develop/qa/main) | Git Flow |
| Despliegue | Railway | URL pública para demo final |

---

## 📊 Resumen de Historias de Usuario

| Release | HUs | Total HU | Story Points | Semanas | Responsables |
|---------|-----|----------|--------------|---------|--------------|
| Release 1 — MVP | HU-001 a HU-009 | 9 | 42 | 1–5 | Santiago / Sneyder / Nelson |
| Release 2 — Auth | HU-010 a HU-020 | 11 | 65 | 6–10 | Santiago / Sneyder / Nelson |
| Release 3 — Completo | HU-021 a HU-028 | 8 | 62 | 11–16 | Santiago / Sneyder / Nelson |
| **TOTAL** | **HU-001 a HU-028** | **28** | **169** | **16** | **Equipo completo** |

---

## 📝 Historias de Usuario — Release 1: MVP

### HU-001 — Registrar nueva reserva
**Como** usuario registrado **quiero** crear una reserva para una cancha en fecha y hora especifica **para** asegurar mi turno y evitar conflictos de horario.

**Criterios de aceptación:**
1. Validar solapamiento de horario — responder HTTP 409 si hay conflicto
2. La reserva queda en estado PENDIENTE al crearse
3. idUsuario, idCancha, fecha, horaInicio y horaFin son obligatorios
4. La fecha no puede ser menor a la fecha actual

**Prioridad:** Alta | **Story Points:** 5 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 1

---

### HU-002 — Consultar y gestionar reservas (CRUD completo)
**Como** usuario registrado **quiero** ver, editar y cancelar mis reservas **para** gestionar mis agendamientos sin depender de un administrador.

**Criterios de aceptación:**
1. GET /reservas retorna lista completa con todos los campos del DTO
2. GET /reservas/{id} retorna 404 si no existe
3. PUT /reservas/{id} valida solapamiento excluyendo la propia reserva
4. DELETE /reservas/{id} retorna 204; 404 si no existe

**Prioridad:** Alta | **Story Points:** 5 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 1

---

### HU-003 — Contrato HTTP semantico de errores
**Como** desarrollador frontend **quiero** recibir codigos HTTP correctos segun el tipo de error **para** implementar manejo de errores diferenciado en la interfaz.

**Criterios de aceptación:**
1. 404 para recurso no encontrado con mensaje descriptivo incluyendo el id
2. 409 para conflicto de horario con detalle de cancha, fecha y horario
3. 400 para validacion de campos con lista de campos invalidos
4. 500 para errores internos del sistema con mensaje generico
5. Cuerpo de error siempre incluye timestamp y message

**Prioridad:** Alta | **Story Points:** 4 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 1

---

### HU-004 — Gateway como punto de entrada unico
**Como** desarrollador frontend **quiero** un unico punto de entrada en puerto 8080 **para** simplificar la configuracion del cliente y centralizar el enrutamiento.

**Criterios de aceptación:**
1. Gateway enruta /reservas/** hacia ms-reservas en puerto 8081
2. URL del microservicio destino se lee desde variable de entorno MS_RESERVAS_URL
3. CORS configurado desde variable de entorno CORS_ORIGINS
4. Gateway propaga errores HTTP correctamente al cliente (404, 409, 400)
5. Gateway contenedorizado y funcional en docker-compose

**Prioridad:** Alta | **Story Points:** 5 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 1

---

### HU-005 — Vista de reservas con CRUD completo
**Como** usuario **quiero** ver y gestionar mis reservas desde una interfaz web **para** administrar mis agendamientos de forma visual.

**Criterios de aceptación:**
1. Lista de reservas en tabla (desktop) y cards (mobile)
2. Formulario para crear nueva reserva con validacion de campos requeridos
3. Boton de editar que precarga los datos en el formulario
4. Modal de confirmacion antes de eliminar una reserva
5. Mensajes de exito y error despues de cada operacion
6. Consume el gateway en localhost:8080

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 1

---

### HU-006 — Estructura base del portal React
**Como** desarrollador frontend **quiero** tener la estructura de carpetas y componentes base del portal **para** que el equipo pueda trabajar de forma organizada y escalable.

**Criterios de aceptación:**
1. Proyecto creado con Vite + React + Tailwind CSS
2. Estructura de carpetas: components, pages, services, hooks, context, stores, styles
3. Componentes base: Navbar, Header, Footer, MainLayout
4. Servicio reservaServices.js con axios apuntando al gateway
5. README.md con instrucciones de instalacion y conventional commits

**Prioridad:** Alta | **Story Points:** 3 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 1

---

### HU-007 — Esquema inicial de base de datos PostgreSQL
**Como** equipo de desarrollo **quiero** tener el esquema SQL inicial documentado y versionado **para** que cualquier desarrollador pueda reproducir la BD desde cero.

**Criterios de aceptación:**
1. Script SQL con tablas: usuarios, canchas, reservas
2. Tabla reservas con foreign keys a usuarios y canchas
3. Constraint CHECK que valida hora_fin > hora_inicio
4. Indice idx_reserva_cancha_fecha para optimizar consultas de disponibilidad
5. Script de datos semilla (seed) con al menos 3 canchas y 2 usuarios de prueba

**Prioridad:** Alta | **Story Points:** 4 | **Repo:** DB | **Responsable:** Nelson | **Release:** Release 1

---

### HU-008 — Diagrama ERD y modelo de datos documentado
**Como** equipo de desarrollo **quiero** tener el modelo de datos documentado con diagrama ERD **para** facilitar la comprension de la estructura de datos.

**Criterios de aceptación:**
1. Diagrama ERD con todas las entidades, atributos y relaciones
2. Diagrama de clases Java correspondiente al modelo
3. README.md del repo db con descripcion de cada tabla y sus campos
4. Relaciones documentadas: 1:N usuario-reserva, 1:N cancha-reserva

**Prioridad:** Alta | **Story Points:** 3 | **Repo:** DB | **Responsable:** Nelson | **Release:** Release 1

---

### HU-009 — Contenedorizacion completa con Docker Compose
**Como** desarrollador **quiero** levantar todo el sistema con docker-compose up **para** facilitar la ejecucion del proyecto en cualquier maquina.

**Criterios de aceptación:**
1. docker-compose incluye: postgres, pgadmin, ms-reservas, gateway
2. URLs entre servicios usan nombres de servicio Docker (no localhost)
3. Credenciales de BD pasadas como variables de entorno
4. gateway depends_on ms-reservas; ms-reservas depends_on postgres
5. Datos de postgres persisten en volumen nombrado
6. Dockerfile creado para ms-reservas y gateway

**Prioridad:** Alta | **Story Points:** 5 | **Repo:** Infra | **Responsable:** Oscar | **Release:** Release 1

---

## 📝 Historias de Usuario — Release 2: Autenticacion

### HU-010 — Registro de usuario con BCrypt
**Como** visitante **quiero** crear una cuenta con nombre, email y contrasena **para** poder acceder al sistema y realizar reservas.

**Criterios de aceptación:**
1. POST /auth/register crea usuario en MongoDB
2. Email debe ser unico — HTTP 409 si ya existe
3. Contrasena almacenada hasheada con BCrypt (nunca en texto plano)
4. Rol por defecto al registrarse es USER
5. HTTP 201 con id, email y rol (sin exponer contrasena)

**Prioridad:** Alta | **Story Points:** 5 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-011 — Login y emision de JWT
**Como** usuario registrado **quiero** autenticarme con email y contrasena **para** obtener un token JWT que me permita acceder a los recursos protegidos.

**Criterios de aceptación:**
1. POST /auth/login valida credenciales contra MongoDB
2. Credenciales incorrectas retorna HTTP 401 Unauthorized
3. JWT incluye claims: sub (email), role, userId y exp (24h)
4. Token firmado con clave secreta configurada via JWT_SECRET
5. Respuesta incluye token, tipo Bearer y tiempo de expiracion

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-012 — Filtro JWT en el Gateway
**Como** sistema **quiero** que el gateway valide el JWT en cada request antes de enrutarlo **para** proteger todos los microservicios sin duplicar logica de autenticacion.

**Criterios de aceptación:**
1. Filtro WebFlux extrae Bearer token del header Authorization
2. Token invalido o ausente retorna HTTP 401 antes de enrutar
3. Token valido propaga headers X-User-Id y X-User-Role al microservicio destino
4. Rutas POST /auth/register y POST /auth/login excluidas del filtro
5. Filtro usa la misma JWT_SECRET configurada en ms-auth

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-013 — Control de acceso por rol (ADMIN vs USER)
**Como** administrador **quiero** que ciertas operaciones solo puedan ejecutarlas usuarios ADMIN **para** garantizar que acciones criticas esten protegidas.

**Criterios de aceptación:**
1. Rol ADMIN puede ver reservas de cualquier usuario
2. Rol USER solo puede ver y gestionar sus propias reservas
3. USER intentando acceder a recursos de otro usuario retorna HTTP 403
4. Microservicios leen el rol del header X-User-Role propagado por el gateway
5. PATCH /auth/users/{id}/role solo accesible por ADMIN

**Prioridad:** Alta | **Story Points:** 6 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-014 — Gestion de canchas (catalogo CRUD)
**Como** administrador **quiero** crear, editar y desactivar canchas del sistema **para** mantener actualizado el catalogo de canchas disponibles.

**Criterios de aceptación:**
1. CRUD de canchas: nombre, tipo, precio por hora, estado (activa/inactiva)
2. Solo ADMIN puede crear, editar o desactivar canchas
3. Cancha inactiva no aparece en disponibilidad de reservas
4. GET /canchas es publico (no requiere autenticacion)
5. Eliminacion logica (campo activo=false), no fisica

**Prioridad:** Alta | **Story Points:** 6 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-015 — Migraciones de esquema con Flyway
**Como** desarrollador **quiero** que el esquema PostgreSQL se gestione con Flyway **para** tener historial versionado de cambios reproducible en todos los entornos.

**Criterios de aceptación:**
1. Dependencias flyway-core y flyway-database-postgresql en pom.xml
2. ddl-auto cambia de update a validate en application.yml de produccion
3. Existe V1__crear_tabla_reservas.sql con el esquema actual
4. Existe V2__crear_tabla_canchas.sql cuando se agrega esa tabla
5. show-sql desactivado en produccion, activado solo en perfil dev

**Prioridad:** Media | **Story Points:** 4 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 2

---

### HU-016 — Paginas de Login y Registro en el portal
**Como** usuario **quiero** poder registrarme e iniciar sesion desde la interfaz web **para** acceder de forma segura a mis reservas.

**Criterios de aceptación:**
1. Paginas de Login y Registro con validacion de formularios
2. Token JWT recibido se almacena en localStorage
3. Todos los requests a recursos protegidos incluyen Authorization: Bearer token
4. Si el token expira la app redirige automaticamente al login
5. Boton de cerrar sesion que elimina el token y redirige al login

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 2

---

### HU-017 — Catalogo de canchas en el portal
**Como** usuario **quiero** ver las canchas disponibles antes de hacer una reserva **para** elegir la cancha que mejor se adapte a mis necesidades.

**Criterios de aceptación:**
1. Pagina /canchas muestra lista de canchas activas en cards
2. Cada card muestra: nombre, tipo, precio por hora, estado
3. Boton "Reservar" en cada card que prellena el formulario con el idCancha
4. Solo el ADMIN ve opciones de editar y desactivar canchas
5. Pagina accesible sin autenticacion

**Prioridad:** Alta | **Story Points:** 6 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 2

---

### HU-018 — Navegacion con rutas protegidas
**Como** usuario **quiero** que las paginas privadas redirijan al login si no estoy autenticado **para** garantizar que solo usuarios autenticados accedan a sus reservas.

**Criterios de aceptación:**
1. React Router configurado con rutas publicas y privadas
2. Ruta privada verifica token en localStorage antes de renderizar
3. Sin token redirige a /login automaticamente
4. Navbar muestra opciones segun estado de autenticacion
5. Paginas: /login, /register, /canchas, /mis-reservas, /admin (solo ADMIN)

**Prioridad:** Alta | **Story Points:** 6 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 2

---

### HU-019 — Scripts de MongoDB para ms-auth
**Como** equipo de desarrollo **quiero** tener documentados los esquemas de MongoDB para el microservicio de autenticacion **para** que el equipo entienda la estructura de datos.

**Criterios de aceptación:**
1. Documento JSON ejemplo de la coleccion usuarios en MongoDB
2. README actualizado con descripcion de colecciones MongoDB
3. Script de seed con usuarios de prueba (1 ADMIN, 2 USER) con passwords hasheados
4. Diagrama actualizado incluyendo colecciones MongoDB junto a tablas PostgreSQL

**Prioridad:** Media | **Story Points:** 4 | **Repo:** DB | **Responsable:** Nelson | **Release:** Release 2

---

### HU-020 — Branch strategy y pipeline CI basico
**Como** equipo de desarrollo **quiero** tener las ramas develop, qa y main protegidas con pipeline **para** garantizar que el codigo en main sea siempre estable.

**Criterios de aceptación:**
1. Todos los repos tienen ramas develop, qa y main
2. Merges a qa y main requieren PR con al menos una revision
3. GitHub Action basico que compila el proyecto en cada PR a qa o main
4. Flujo de trabajo: develop -> PR a qa -> PR a main
5. Tags de release siguen semver: v1.0.0, v2.0.0, v3.0.0

**Prioridad:** Media | **Story Points:** 4 | **Repo:** Infra | **Responsable:** Oscar | **Release:** Release 2

---

## 📝 Historias de Usuario — Release 3: Sistema Completo

### HU-021 — Iniciar pago de reserva
**Como** usuario registrado **quiero** pagar mi reserva usando una pasarela de pago **para** confirmar y asegurar mi turno de forma oficial.

**Criterios de aceptación:**
1. POST /pagos recibe idReserva, monto y metodo de pago
2. ms-pagos consulta ms-reservas para validar que la reserva existe y esta PENDIENTE
3. Pago exitoso notifica a ms-reservas para cambiar estado a CONFIRMADA
4. Pago persiste en MongoDB: idPago, idReserva, monto, estado, fechaPago
5. Endpoint protegido por JWT — solo el propietario puede pagar su reserva

**Prioridad:** Alta | **Story Points:** 10 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 3

---

### HU-022 — Notificacion de confirmacion y cancelacion
**Como** usuario **quiero** recibir notificaciones cuando mi reserva sea confirmada o cancelada **para** tener constancia del agendamiento y del resultado de cancelaciones.

**Criterios de aceptación:**
1. ms-notificaciones expone POST /notificaciones/enviar
2. Pago exitoso en ms-pagos llama a ms-notificaciones
3. Notificacion incluye: usuario, cancha, fecha, hora inicio y fin, monto
4. Notificaciones persisten en MongoDB con estado ENVIADO o FALLIDO
5. Fallo en envio no afecta el flujo principal

**Prioridad:** Alta | **Story Points:** 6 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 3

---

### HU-023 — Reembolso al cancelar reserva confirmada
**Como** usuario registrado **quiero** que al cancelar una reserva confirmada se genere un reembolso **para** recuperar el monto pagado si cancelo con anticipacion suficiente.

**Criterios de aceptación:**
1. Cancelar reserva CONFIRMADA notifica a ms-pagos
2. ms-pagos crea registro de reembolso y cambia estado del pago a REEMBOLSADO
3. Solo se reembolsa si la cancelacion es con mas de 24 horas de anticipacion
4. Menos de 24h cambia estado del pago a SIN_REEMBOLSO
5. Usuario recibe notificacion del resultado via ms-notificaciones

**Prioridad:** Media | **Story Points:** 8 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 3

---

### HU-024 — Dashboard de reportes para administrador
**Como** administrador **quiero** ver un dashboard con metricas del sistema **para** tomar decisiones informadas sobre el uso de las canchas.

**Criterios de aceptación:**
1. GET /reportes/resumen retorna metricas agregadas
2. Metricas: total reservas por estado, ingresos del mes, cancha mas demandada, horas pico
3. ms-reportes consulta ms-reservas y ms-pagos para obtener los datos
4. Solo ADMIN puede acceder a los reportes
5. GET /reportes/reservas acepta fechaInicio y fechaFin; maximo 90 dias

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** API | **Responsable:** Santiago | **Release:** Release 3

---

### HU-025 — Flujo de pago en el portal
**Como** usuario **quiero** pagar mi reserva desde la interfaz web **para** confirmar mi turno sin salir de la aplicacion.

**Criterios de aceptación:**
1. Boton "Pagar" visible en reservas con estado PENDIENTE
2. Modal de confirmacion de pago con monto calculado segun precio de cancha y horas
3. Estado de la reserva cambia visualmente a CONFIRMADA tras pago exitoso
4. Mensaje de error si el pago falla
5. Historial de pagos visible en perfil del usuario

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 3

---

### HU-026 — Dashboard de administrador en el portal
**Como** administrador **quiero** ver el dashboard de reportes en la interfaz web **para** consultar metricas del sistema de forma visual.

**Criterios de aceptación:**
1. Pagina /admin accesible solo con rol ADMIN
2. Graficos de: reservas por estado (dona), ingresos del mes (barras)
3. Tabla de reservas filtrable por rango de fechas
4. Indicadores numericos: total reservas, ingresos mes, cancha mas usada
5. Datos consumidos desde ms-reportes via gateway

**Prioridad:** Alta | **Story Points:** 8 | **Repo:** Portal | **Responsable:** Sneyder | **Release:** Release 3

---

### HU-027 — Colecciones MongoDB para ms-pagos y ms-notificaciones
**Como** equipo de desarrollo **quiero** tener documentadas las colecciones MongoDB de pagos y notificaciones **para** que el equipo entienda la estructura completa de datos del sistema.

**Criterios de aceptación:**
1. Documento JSON ejemplo de coleccion pagos en MongoDB
2. Documento JSON ejemplo de coleccion notificaciones en MongoDB
3. Script de seed con pagos y notificaciones de prueba
4. README actualizado con todas las colecciones del sistema
5. Diagrama de datos completo: PostgreSQL + todas las colecciones MongoDB

**Prioridad:** Media | **Story Points:** 4 | **Repo:** DB | **Responsable:** Nelson | **Release:** Release 3

---

### HU-028 — Demo final: sistema completo integrado
**Como** equipo de desarrollo **quiero** presentar el sistema completo funcionando **para** demostrar la arquitectura distribuida implementada durante el semestre.

**Criterios de aceptación:**
1. docker-compose levanta todos los servicios: postgres, mongodb, ms-auth, ms-reservas, ms-pagos, ms-notificaciones, ms-reportes, gateway y portal
2. Flujo completo funciona: registro -> login -> ver canchas -> reservar -> pagar -> notificacion
3. Documentacion de arquitectura con diagrama de microservicios
4. Repositorios con historial de PRs en develop, qa y main
5. Presentacion incluye ADRs documentados y demo en vivo

**Prioridad:** Alta | **Story Points:** 10 | **Repo:** Infra | **Responsable:** Todo el equipo | **Release:** Release 3

---

## 🗺️ Roadmap de 16 Semanas

### 🟢 Corte 1 — Release 1: MVP (Semanas 1–5)

| Semana | Titulo | API (Santiago) | Portal (Sneyder) | DB (Nelson) | Entregable |
|--------|--------|---------------|-----------------|-------------|------------|
| 1 | Kickoff y Setup | HU-001 inicio, HU-009 inicio | HU-006 | HU-007 inicio, HU-008 | 4 repos en GitHub con README y ramas configuradas |
| 2 | ms-reservas: Modelo y Repo | HU-001, HU-002 inicio | HU-005 inicio | HU-007 | GET /reservas y POST /reservas con datos reales |
| 3 | ms-reservas: CRUD + Errores | HU-002, HU-003 | HU-005 | HU-007 | CRUD completo con excepciones tipadas |
| 4 | Gateway y Contenedorizacion | HU-004, HU-009 | HU-005, HU-006 | HU-008 | Gateway + docker-compose; portal conectado |
| 5 ⭐ | **Release 1: MVP completo** | HU-001 a HU-004, HU-009 | HU-005, HU-006 | HU-007, HU-008 | **RELEASE 1 (15%): ms-reservas + gateway + portal + Docker** |

### 🔵 Corte 2 — Release 2: Autenticacion (Semanas 6–10)

| Semana | Titulo | API (Santiago) | Portal (Sneyder) | DB (Nelson) | Entregable |
|--------|--------|---------------|-----------------|-------------|------------|
| 6 | ms-auth: Registro y Login | HU-010, HU-011 | HU-016 inicio | HU-019 inicio | ms-auth con MongoDB, registro e inicio de sesion con JWT |
| 7 | Gateway: Filtro JWT | HU-012 | HU-016 | HU-019 | Gateway valida JWT; rutas protegidas devuelven 401 sin token |
| 8 | Roles, Canchas y Rutas portal | HU-013, HU-014 | HU-016, HU-017, HU-018 | HU-019 | Roles implementados; portal con login y rutas protegidas |
| 9 | Flyway, CI y catalogo portal | HU-015 | HU-017, HU-018 | HU-019 | Flyway en ms-reservas; pipeline CI activo; catalogo en portal |
| 10 ⭐ | **Release 2: Sistema con Auth** | HU-010 a HU-015 | HU-016 a HU-018 | HU-019, HU-020 | **RELEASE 2 (15%): ms-auth + JWT + roles + portal con login** |

### 🟣 Corte 3 — Release 3: Sistema Completo (Semanas 11–16)

| Semana | Titulo | API (Santiago) | Portal (Sneyder) | DB (Nelson) | Entregable |
|--------|--------|---------------|-----------------|-------------|------------|
| 11 | ms-pagos: Estructura | HU-021 | HU-025 inicio | HU-027 inicio | ms-pagos con MongoDB; pago exitoso confirma reserva |
| 12 | ms-notificaciones: Eventos | HU-022 | HU-025 | HU-027 | ms-notificaciones integrado con ms-pagos |
| 13 | Reembolsos y flujo pago portal | HU-023 | HU-025 | HU-027 | Flujo completo de reembolso con regla de 24h |
| 14 | ms-reportes y Dashboard | HU-024 | HU-026 | HU-027 | ms-reportes operativo; dashboard con graficos en portal |
| 15 ⭐ | **Release 3: Sistema Completo** | HU-021 a HU-024 | HU-025, HU-026 | HU-027, HU-028 | **RELEASE 3 (15%): 5 microservicios + portal + Docker Compose** |
| 16 🎓 | **Demo Final** | HU-028 | HU-028 | HU-028 | **DEMO FINAL (15%): Presentacion ejecutiva del sistema** |

---

## 📊 Sistema de Evaluacion

| Componente | Descripcion | Peso | Semana | HUs |
|------------|-------------|------|--------|-----|
| Weeklys | Avance semanal demostrado cada clase 1. Evaluacion continua. | 40% | 1–16 | Todas |
| Release 1 | MVP: ms-reservas + gateway + portal + Docker funcionando. | 15% | Sem. 5 | HU-001 a HU-009 |
| Release 2 | Auth: ms-auth + JWT + roles + Flyway + CI basico. | 15% | Sem. 10 | HU-010 a HU-020 |
| Release 3 | Completo: pagos + notificaciones + reportes integrados. | 15% | Sem. 15 | HU-021 a HU-028 |
| Demo Final | Presentacion ejecutiva, ADRs sustentados, demo en vivo. | 15% | Sem. 16 | HU-028 |

---

## 🔀 Flujo de Trabajo Git

```
feature/nombre  →  develop  →  qa  →  main
```

Todos los repositorios siguen este flujo:
1. Crear rama desde `develop`: `git checkout -b feat/nombre-funcionalidad`
2. Desarrollar y commitear con **Conventional Commits**
3. Abrir PR hacia `develop` con descripcion de los cambios
4. Mergear a `develop` tras revision
5. Al finalizar el sprint: PR de `develop` → `qa` → `main`

### Conventional Commits

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat(ms-auth): add JWT token emission` |
| `fix` | Correccion de errores | `fix(gateway): handle 409 response correctly` |
| `refactor` | Refactorizacion | `refactor(ms-reservas): replace RuntimeException with typed exceptions` |
| `docs` | Documentacion | `docs: update README with setup instructions` |
| `chore` | Mantenimiento | `chore: update gitignore to exclude target folder` |
| `test` | Tests | `test(ms-reservas): add unit tests for ReservaService` |

---

## 📚 ADRs Documentados

| ADR | Titulo | Estado | Repo |
|-----|--------|--------|------|
| ADR-001 | Externalizacion de configuracion en el Gateway | ✅ Aplicado | API |
| ADR-002 | Jerarquia de excepciones de dominio | ✅ Aplicado | API |
| ADR-003 | Contenedorizacion completa con Docker | ✅ Aplicado | Infra |

Los ADRs completos estan documentados en `docs/ADR/ADR-reservas-canchas.md` en este repo.

---

*CORHUILA — Ingenieria de Sistemas — Sistemas Distribuidos 2026-1*  
*28 HUs • 5 Microservicios • 3 Repos • 16 Semanas | Santiago / Sneyder / Nelson / Oscar / Ivan*