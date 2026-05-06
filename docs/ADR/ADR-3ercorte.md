Sí, con esos dos repos el planteamiento de ADR debe quedar más completo, porque ahora la arquitectura no solo se justifica desde el backend, sino desde **tres capas del proyecto**:

```txt
reservas-canchas-api       -> microservicios, gateway, seguridad, Docker
reservas-canchas-db        -> modelo de datos, Liquibase, backups, diagramas
reservas-canchas-portal    -> frontend React, rutas protegidas, Axios, ambientes
```

Además, encontré puntos importantes en los repos:

* El **frontend** usa React + Vite + Axios + React Router.
* Tiene configuración por ambiente con `config.dev.js`, `config.qa.js` y `config.main.js`.
* Usa `localStorage` para guardar el JWT.
* Usa rutas protegidas con `ProtectedRoute` y `AdminRoute`.
* Ya consume `/auth`, `/reservas` y `/canchas`.
* El formulario de reserva ya selecciona canchas desde una lista, no escribiendo manualmente el ID.
* El repo de **BD** usa Liquibase, scripts SQL, backups y diagramas ERD/MER.
* El repo de **API** tiene `gateway`, `ms-auth`, `ms-reservas` e `infra/docker-compose.yml`.

Te dejo una versión más profesional y actualizada de los **25 ADR**, repartidos como **5 por integrante**.

---

# ADR profesionales del proyecto

## Sistema Distribuido de Reservas de Canchas Deportivas

---

# Distribución por integrantes

| Integrante   |     ADR asignados | Área                                           |
| ------------ | ----------------: | ---------------------------------------------- |
| Integrante 1 | ADR-001 a ADR-005 | Arquitectura distribuida y microservicios      |
| Integrante 2 | ADR-006 a ADR-010 | Base de datos, Liquibase y persistencia        |
| Integrante 3 | ADR-011 a ADR-015 | Seguridad, autenticación y autorización        |
| Integrante 4 | ADR-016 a ADR-020 | Frontend, integración y experiencia de usuario |
| Integrante 5 | ADR-021 a ADR-025 | DevOps, ambientes, pruebas y evolución         |

---

# Integrante 1 — Arquitectura distribuida y microservicios

---

## ADR-001: Separar el sistema en repositorios por responsabilidad

**Estado:** Aceptado
**Responsable:** Integrante 1
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-db`, `reservas-canchas-portal`

### Contexto

El proyecto no se limita a una sola aplicación. Tiene backend, frontend, infraestructura y base de datos. Si todo estuviera en un único repositorio, sería más difícil mantener la separación de responsabilidades, trabajar en equipo y evidenciar una arquitectura distribuida.

### Decisión

Se decide separar el sistema en tres repositorios principales:

```txt
reservas-canchas-api      -> servicios backend, gateway e infraestructura
reservas-canchas-db       -> scripts, modelo, backups y versionamiento de BD
reservas-canchas-portal   -> frontend React
```

### Alternativas consideradas

| Alternativa            | Ventaja                              | Desventaja                         |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| Un solo repositorio    | Más simple inicialmente              | Alto acoplamiento y menor claridad |
| Repositorios separados | Mayor organización y responsabilidad | Requiere mejor coordinación        |

### Consecuencias

**Positivas:**

* Facilita repartir trabajo entre integrantes.
* Permite versionar frontend, backend y base de datos por separado.
* Mejora la sustentación técnica del proyecto.
* Representa mejor una arquitectura distribuida.

**Negativas:**

* Requiere mantener documentación clara entre repositorios.
* Se deben sincronizar cambios entre frontend, backend y base de datos.

---

## ADR-002: Adoptar arquitectura basada en microservicios

**Estado:** Aceptado
**Responsable:** Integrante 1
**Repo relacionado:** `reservas-canchas-api`

### Contexto

El sistema maneja varias capacidades: autenticación, reservas, canchas, pagos, notificaciones y reportes. Estas responsabilidades pueden crecer de forma independiente.

### Decisión

Se adopta una arquitectura basada en microservicios.

Servicios actuales:

```txt
gateway
ms-auth
ms-reservas
```

Servicios proyectados:

```txt
ms-pagos
ms-notificaciones
ms-reportes
```

### Alternativas consideradas

| Alternativa    | Ventaja                               | Desventaja                    |
| -------------- | ------------------------------------- | ----------------------------- |
| Monolito       | Menor complejidad inicial             | Difícil de escalar y mantener |
| Microservicios | Separación, escalabilidad y autonomía | Mayor complejidad operativa   |

### Consecuencias

**Positivas:**

* Se evidencia arquitectura distribuida.
* Cada servicio puede evolucionar por separado.
* Facilita asignar responsabilidades dentro del equipo.

**Negativas:**

* Requiere comunicación entre servicios.
* Aumenta la complejidad de despliegue y pruebas.

---

## ADR-003: Usar API Gateway como punto único de entrada

**Estado:** Aceptado
**Responsable:** Integrante 1
**Repo relacionado:** `reservas-canchas-api/gateway`

### Contexto

El frontend no debería conocer directamente los puertos ni las rutas internas de cada microservicio. Si lo hiciera, quedaría acoplado a la infraestructura interna.

### Decisión

Se implementa un API Gateway como entrada única del sistema.

```txt
Frontend React
      |
      v
API Gateway
      |
      |-- ms-auth
      |-- ms-reservas
```

### Justificación

El gateway centraliza rutas, seguridad, CORS y comunicación con los microservicios. Esto mejora la organización y evita que el frontend dependa de múltiples URLs internas.

### Consecuencias

**Positivas:**

* El frontend consume una sola URL base.
* Se oculta la ubicación real de los microservicios.
* Se facilita la configuración de CORS y rutas.

**Negativas:**

* Si el gateway falla, afecta el acceso al sistema.
* Debe mantenerse correctamente configurado.

---

## ADR-004: Usar comunicación REST/HTTP entre frontend, gateway y microservicios

**Estado:** Aceptado
**Responsable:** Integrante 1
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-portal`

### Contexto

El sistema necesita una forma clara y sencilla de comunicación entre frontend y backend. También debe poder probarse con herramientas como Postman.

### Decisión

Se usa REST sobre HTTP para la comunicación principal.

Ejemplos de endpoints:

```txt
POST /auth/login
POST /auth/register
GET  /reservas
POST /reservas
GET  /canchas
POST /canchas
```

### Alternativas consideradas

| Alternativa          | Ventaja                            | Desventaja               |
| -------------------- | ---------------------------------- | ------------------------ |
| REST                 | Simple, estándar y fácil de probar | Comunicación síncrona    |
| gRPC                 | Mayor rendimiento                  | Más complejo             |
| Mensajería asíncrona | Mayor desacoplamiento              | Excesivo para esta etapa |

### Consecuencias

**Positivas:**

* Fácil integración con React.
* Fácil validación en Postman.
* Compatible con Spring Boot y Axios.

**Negativas:**

* Si un servicio no responde, la operación falla.
* Requiere manejo adecuado de errores HTTP.

---

## ADR-005: Separar responsabilidades por contexto funcional

**Estado:** Aceptado
**Responsable:** Integrante 1
**Repo relacionado:** `reservas-canchas-api`

### Contexto

Autenticación, reservas y canchas son responsabilidades diferentes. Mezclarlas en un único servicio dificultaría el mantenimiento.

### Decisión

Cada microservicio se organiza alrededor de un contexto funcional.

| Servicio      | Responsabilidad                 |
| ------------- | ------------------------------- |
| `ms-auth`     | Registro, login, usuarios y JWT |
| `ms-reservas` | Reservas y canchas              |
| `gateway`     | Enrutamiento y entrada única    |

### Consecuencias

**Positivas:**

* Código más organizado.
* Servicios más fáciles de probar.
* Mejor alineación con arquitectura distribuida.

**Negativas:**

* Requiere definir contratos entre servicios.
* Puede existir duplicación mínima de información entre dominios.

---

# Integrante 2 — Base de datos, Liquibase y persistencia

---

## ADR-006: Usar un repositorio independiente para base de datos

**Estado:** Aceptado
**Responsable:** Integrante 2
**Repo relacionado:** `reservas-canchas-db`

### Contexto

La base de datos no debe depender únicamente del código del backend. El proyecto necesita evidenciar modelo de datos, scripts, backups, diagramas y versionamiento.

### Decisión

Se mantiene un repositorio dedicado para base de datos:

```txt
reservas-canchas-db
```

Este repositorio contiene:

```txt
changelog-master.xml
changelog-01-create-tables.xml
changelog-02-initial-data.xml
liquibase.properties
bk_reservas.sql
model/erd.png
model/mer.png
scripts/
```

### Consecuencias

**Positivas:**

* La base de datos queda documentada y versionada.
* Facilita la sustentación del modelo ERD/MER.
* Permite separar cambios de datos respecto al backend.

**Negativas:**

* Requiere sincronización con las entidades del backend.
* Se debe cuidar que los changelogs no se desactualicen.

---

## ADR-007: Versionar la base de datos con Liquibase

**Estado:** Aceptado
**Responsable:** Integrante 2
**Repo relacionado:** `reservas-canchas-db`

### Contexto

Usar únicamente `ddl-auto:update` en Spring Boot no es suficiente para ambientes QA o MAIN, porque los cambios de esquema no quedan controlados formalmente.

### Decisión

Se usa Liquibase para versionar cambios de base de datos mediante changelogs XML.

Archivo principal:

```txt
changelog-master.xml
```

Archivos incluidos:

```txt
changelog-01-create-tables.xml
changelog-02-initial-data.xml
```

### Alternativas consideradas

| Alternativa                 | Ventaja               | Desventaja          |
| --------------------------- | --------------------- | ------------------- |
| Hibernate `ddl-auto:update` | Rápido en desarrollo  | Riesgoso en QA/MAIN |
| SQL manual                  | Control directo       | Difícil de mantener |
| Liquibase                   | Versionamiento formal | Requiere disciplina |

### Consecuencias

**Positivas:**

* Los cambios de BD son trazables.
* Se puede saber qué versión del esquema está aplicada.
* Mejora la madurez técnica del proyecto.

**Negativas:**

* Requiere mantener bien los IDs de changesets.
* Si hay duplicados o rutas incorrectas, Liquibase puede fallar.

### Observación importante

En el repo de BD conviene revisar el `changelog-master.xml`, porque referencia rutas como:

```txt
db/changelog/auth/01-usuarios.xml
db/changelog/auth/02-roles.xml
db/changelog/reservas/03-canchas.xml
db/changelog/reservas/04-reservas.xml
```

pero en la estructura actual no se observan esas carpetas. También conviene revisar duplicidad de IDs en `changelog-01-create-tables.xml`.

---

## ADR-008: Usar PostgreSQL para reservas, canchas y datos relacionales

**Estado:** Aceptado
**Responsable:** Integrante 2
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-db`

### Contexto

Las reservas y canchas son datos estructurados. Una reserva se relaciona con una cancha, una fecha, una hora de inicio y una hora de fin. Además, se requiere validar disponibilidad.

### Decisión

Se utiliza PostgreSQL como base de datos relacional para reservas y canchas.

Tablas principales:

```txt
canchas
reservas
```

### Justificación

PostgreSQL permite manejar relaciones, restricciones, consultas estructuradas y validaciones de integridad.

### Consecuencias

**Positivas:**

* Buen soporte para datos relacionales.
* Facilita validar horarios y disponibilidad.
* Compatible con Spring Data JPA.

**Negativas:**

* Requiere control de esquema.
* Los cambios deben sincronizarse con Liquibase.

---

## ADR-009: Mantener scripts de backup y restauración de base de datos

**Estado:** Aceptado
**Responsable:** Integrante 2
**Repo relacionado:** `reservas-canchas-db`

### Contexto

El proyecto puede requerir restaurar datos de prueba o evidenciar que la base de datos puede recuperarse.

### Decisión

Se mantiene un script de backup:

```txt
bk_reservas.sql
scripts/bk_reservas.sql
```

### Consecuencias

**Positivas:**

* Permite recuperar datos iniciales.
* Sirve como evidencia técnica.
* Facilita preparar la demo.

**Negativas:**

* El backup debe actualizarse cuando cambie el modelo.
* No reemplaza las migraciones de Liquibase.

---

## ADR-010: Documentar el modelo de datos con ERD, MER y diagrama de clases

**Estado:** Aceptado
**Responsable:** Integrante 2
**Repo relacionado:** `reservas-canchas-db/model`

### Contexto

Para sustentar el proyecto no basta con mostrar tablas. Es necesario explicar cómo se relacionan las entidades.

### Decisión

Se documenta el modelo de datos mediante diagramas:

```txt
model/erd.png
model/mer.png
model/diagrama de clases.png
```

### Consecuencias

**Positivas:**

* Facilita la explicación al docente.
* Conecta la base de datos con el diseño del sistema.
* Ayuda a justificar las relaciones entre usuarios, roles, canchas y reservas.

**Negativas:**

* Los diagramas deben actualizarse si cambia el modelo.
* Puede haber inconsistencias si el código evoluciona y el diagrama no.

---

# Integrante 3 — Seguridad, autenticación y autorización

---

## ADR-011: Implementar autenticación con JWT

**Estado:** Aceptado
**Responsable:** Integrante 3
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-portal`

### Contexto

El sistema requiere autenticar usuarios y permitir que el frontend consuma rutas protegidas. En una arquitectura distribuida no es ideal usar sesiones tradicionales en servidor.

### Decisión

Se usa JWT para autenticar usuarios.

Flujo:

```txt
Usuario inicia sesión
ms-auth valida credenciales
ms-auth genera token JWT
Frontend almacena token
Frontend envía Authorization: Bearer <token>
Backend valida token
```

### Consecuencias

**Positivas:**

* No requiere sesiones en servidor.
* Funciona bien con microservicios.
* Permite incluir rol e identificador de usuario.

**Negativas:**

* El token debe protegerse.
* Si el token expira, el frontend debe manejar la sesión.

---

## ADR-012: Almacenar el JWT en localStorage para la sesión del frontend

**Estado:** Aceptado con restricciones
**Responsable:** Integrante 3
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

El frontend necesita conservar el token después del login para enviarlo en cada petición protegida.

### Decisión

El frontend almacena el token en `localStorage`.

Evidencia en el portal:

```js
localStorage.setItem("token", data.token);
```

Y en el interceptor de Axios:

```js
config.headers.Authorization = `Bearer ${token}`;
```

### Alternativas consideradas

| Alternativa      | Ventaja                      | Desventaja                               |
| ---------------- | ---------------------------- | ---------------------------------------- |
| Memoria React    | Más seguro ante persistencia | Se pierde al recargar                    |
| localStorage     | Simple y persistente         | Riesgo ante XSS                          |
| Cookies HttpOnly | Más seguro                   | Requiere configuración backend adicional |

### Consecuencias

**Positivas:**

* Implementación sencilla.
* Permite mantener sesión al recargar.
* Compatible con Axios.

**Negativas:**

* Debe evitarse XSS.
* En una versión más avanzada, se recomienda migrar a cookies HttpOnly.

---

## ADR-013: Proteger rutas del frontend según autenticación

**Estado:** Aceptado
**Responsable:** Integrante 3
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

Un usuario no autenticado no debe acceder al dashboard ni a operaciones de reservas.

### Decisión

Se implementa `ProtectedRoute` en React Router.

Comportamiento:

```txt
Si hay token -> permite acceso
Si no hay token -> redirige a /login
```

### Consecuencias

**Positivas:**

* Mejora la seguridad visual del frontend.
* Evita navegación directa al dashboard sin sesión.
* Facilita separar páginas públicas y privadas.

**Negativas:**

* No reemplaza la seguridad del backend.
* Si el token está vencido pero existe, se necesita validación adicional.

---

## ADR-014: Restringir rutas administrativas con AdminRoute

**Estado:** Aceptado
**Responsable:** Integrante 3
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

Las canchas solo deberían ser administradas por usuarios con rol `ADMIN`.

### Decisión

Se implementa `AdminRoute` para proteger rutas como:

```txt
/dashboard/canchas
/dashboard/canchas/nueva
/dashboard/canchas/:id/editar
/dashboard/canchas/:id/eliminar
```

El rol se obtiene desde el payload del JWT usando `parseJwt`.

### Consecuencias

**Positivas:**

* Mejora separación entre usuario normal y administrador.
* Evita mostrar funcionalidades administrativas a usuarios comunes.
* Refuerza el modelo de roles.

**Negativas:**

* La validación del frontend puede manipularse.
* El backend también debe validar permisos.

---

## ADR-015: Cifrar contraseñas y no almacenar credenciales en texto plano

**Estado:** Aceptado
**Responsable:** Integrante 3
**Repo relacionado:** `reservas-canchas-api/ms-auth`

### Contexto

Guardar contraseñas en texto plano representa un riesgo crítico para los usuarios.

### Decisión

Las contraseñas se cifran usando BCrypt antes de almacenarlas.

### Consecuencias

**Positivas:**

* Reduce riesgos ante filtración de base de datos.
* Sigue una práctica estándar de seguridad.
* Compatible con Spring Security.

**Negativas:**

* No se puede recuperar la contraseña original.
* El proceso de login debe comparar hashes.

---

# Integrante 4 — Frontend, integración y experiencia de usuario

---

## ADR-016: Usar React con Vite para el frontend

**Estado:** Aceptado
**Responsable:** Integrante 4
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

El sistema necesita una interfaz web rápida para autenticación, reservas y administración de canchas.

### Decisión

Se usa React con Vite.

Tecnologías identificadas:

```txt
React
Vite
React Router DOM
Axios
Tailwind CSS
```

### Consecuencias

**Positivas:**

* Desarrollo rápido.
* Buena experiencia de usuario.
* Integración sencilla con API REST.
* Soporte para componentes reutilizables.

**Negativas:**

* Requiere construir el proyecto para producción.
* La configuración por ambiente debe manejarse cuidadosamente.

---

## ADR-017: Centralizar consumo HTTP con Axios e interceptores

**Estado:** Aceptado
**Responsable:** Integrante 4
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

El frontend consume varios endpoints del backend. Si cada componente configura manualmente las peticiones, el código se vuelve repetitivo y difícil de mantener.

### Decisión

Se centraliza el consumo HTTP mediante Axios.

Archivos relevantes:

```txt
src/config/api.js
src/config/apiAuth.js
src/config/apiBase.js
```

`api.js` incluye interceptor para enviar JWT automáticamente.

### Consecuencias

**Positivas:**

* Menos código repetido.
* Todas las peticiones protegidas envían el token.
* Facilita cambiar la URL base por ambiente.

**Negativas:**

* Si el interceptor falla, varias funciones se afectan.
* Debe manejarse correctamente el error 401.

---

## ADR-018: Usar configuración runtime por ambiente en el frontend

**Estado:** Aceptado
**Responsable:** Integrante 4
**Repo relacionado:** `reservas-canchas-portal/public`

### Contexto

El frontend necesita consumir diferentes gateways dependiendo del ambiente.

Archivos existentes:

```txt
config.dev.js
config.qa.js
config.main.js
```

### Decisión

Se usa `window.APP_CONFIG.API_URL` como configuración runtime.

Ejemplo:

```js
window.APP_CONFIG = {
  API_URL: "http://localhost:8002"
};
```

### Justificación

Esta decisión evita recompilar código fuente por cada cambio de URL y permite separar ambientes DEV, QA y MAIN.

### Consecuencias

**Positivas:**

* El frontend se adapta a varios ambientes.
* No depende únicamente de `.env`.
* Es fácil de explicar en sustentación.

**Negativas:**

* Se debe asegurar que `config.js` correcto se copie en cada build.
* Las URLs deben coincidir con los puertos reales del gateway.

---

## ADR-019: Usar rutas declarativas con React Router

**Estado:** Aceptado
**Responsable:** Integrante 4
**Repo relacionado:** `reservas-canchas-portal/src/App.jsx`

### Contexto

El sistema tiene vistas públicas, privadas y administrativas. Se necesita una navegación clara y mantenible.

### Decisión

Se usa React Router para definir rutas:

```txt
/login
/register
/dashboard
/dashboard/reservas/nueva
/dashboard/reservas/:id/editar
/dashboard/canchas
/dashboard/canchas/nueva
```

### Consecuencias

**Positivas:**

* Navegación organizada.
* Separación entre rutas públicas, protegidas y administrativas.
* Facilita extender nuevas páginas.

**Negativas:**

* Requiere mantener coherencia con el backend.
* Las rutas protegidas deben combinarse con validación real del servidor.

---

## ADR-020: Seleccionar canchas desde el frontend consumiendo el backend

**Estado:** Aceptado
**Responsable:** Integrante 4
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

Ingresar manualmente el ID de una cancha genera errores de usuario y mala experiencia. El sistema debe permitir seleccionar una cancha desde una lista.

### Decisión

El formulario de reservas consume el endpoint de canchas y muestra un `<select>` con las canchas activas.

Evidencia funcional:

```txt
useCanchas()
getCanchas()
FormularioCrud
```

### Consecuencias

**Positivas:**

* Mejora la experiencia de usuario.
* Evita errores al escribir IDs manualmente.
* Integra visualmente reservas con canchas.

**Negativas:**

* Si el endpoint de canchas falla, no se puede crear reserva correctamente.
* Requiere manejar estado de carga y errores.

---

# Integrante 5 — DevOps, ambientes, pruebas y evolución

---

## ADR-021: Usar Docker Compose para ejecutar servicios del backend

**Estado:** Aceptado
**Responsable:** Integrante 5
**Repo relacionado:** `reservas-canchas-api/infra`

### Contexto

El backend requiere ejecutar varios servicios: PostgreSQL, MongoDB, ms-auth, ms-reservas, gateway y pgAdmin.

### Decisión

Se usa Docker Compose para levantar la infraestructura.

Servicios definidos:

```txt
postgres
pgadmin
mongodb
ms-auth
ms-reservas
gateway
```

### Consecuencias

**Positivas:**

* Facilita ejecutar el proyecto.
* Reduce errores por configuración local.
* Permite demostrar arquitectura distribuida.

**Negativas:**

* Requiere Docker instalado.
* Puede haber conflictos de puertos.

---

## ADR-022: Manejar ambientes DEV, QA y MAIN

**Estado:** Aceptado
**Responsable:** Integrante 5
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-portal`, `reservas-canchas-db`

### Contexto

El proyecto debe evidenciar separación entre desarrollo, pruebas y versión estable.

### Decisión

Se definen tres ambientes:

```txt
DEV  -> desarrollo
QA   -> pruebas
MAIN -> versión estable
```

En frontend ya existen archivos:

```txt
config.dev.js
config.qa.js
config.main.js
Dockerfile.dev
Dockerfile.qa
Dockerfile.main
```

### Consecuencias

**Positivas:**

* Se evidencia un flujo profesional.
* Permite probar antes de liberar.
* Facilita la sustentación del proyecto.

**Negativas:**

* Se deben alinear puertos entre gateway y frontend.
* La configuración debe mantenerse consistente.

---

## ADR-023: Usar Dockerfiles separados para builds del frontend por ambiente

**Estado:** Aceptado
**Responsable:** Integrante 5
**Repo relacionado:** `reservas-canchas-portal`

### Contexto

El frontend tiene configuraciones diferentes para DEV, QA y MAIN. Cada ambiente necesita construir el portal con su propia URL de API.

### Decisión

Se usan tres Dockerfiles:

```txt
Dockerfile.dev
Dockerfile.qa
Dockerfile.main
```

Cada uno copia el archivo de configuración correspondiente:

```txt
config.dev.js
config.qa.js
config.main.js
```

### Consecuencias

**Positivas:**

* Separación clara por ambiente.
* Facilita demostrar DEV/QA/MAIN.
* El frontend queda listo para servirse con Nginx.

**Negativas:**

* Hay duplicación entre Dockerfiles.
* Si cambia el proceso de build, debe actualizarse en los tres archivos.

---

## ADR-024: Estandarizar contrato de errores para integración frontend-backend

**Estado:** Aceptado
**Responsable:** Integrante 5
**Repos relacionados:** `reservas-canchas-api`, `reservas-canchas-portal`

### Contexto

El frontend muestra mensajes desde:

```js
err.response?.data?.message
err.response?.data?.mensaje
```

Por eso el backend debe devolver errores consistentes.

### Decisión

Se define que el backend responderá errores con un cuerpo JSON estándar.

Ejemplo:

```json
{
  "timestamp": "2026-05-06T18:00:00",
  "message": "La cancha ya está reservada en ese horario"
}
```

Códigos principales:

| Código | Significado           |
| ------ | --------------------- |
| 400    | Validación fallida    |
| 401    | No autenticado        |
| 403    | No autorizado         |
| 404    | Recurso no encontrado |
| 409    | Conflicto de reserva  |
| 500    | Error interno         |

### Consecuencias

**Positivas:**

* El frontend puede mostrar mensajes claros.
* Postman puede validar respuestas.
* La API se comporta de forma más profesional.

**Negativas:**

* Todos los servicios deben respetar el mismo formato.
* Se deben revisar excepciones globales.

---

## ADR-025: Mantener Postman y documentación como evidencia de pruebas

**Estado:** Aceptado
**Responsable:** Integrante 5
**Repo relacionado:** `reservas-canchas-api/docs`

### Contexto

El proyecto debe sustentarse mostrando que los endpoints funcionan. No basta con decir que existen; se necesita evidencia reproducible.

### Decisión

Se mantiene una colección Postman:

```txt
docs/postman_collection.json
```

Debe incluir pruebas para:

```txt
registro de usuario
login
crear reserva
listar reservas
actualizar reserva
eliminar reserva
crear cancha
listar canchas
validar reserva solapada
validar acceso no autorizado
```

### Consecuencias

**Positivas:**

* Sirve como evidencia ante el docente.
* Facilita repetir pruebas.
* Ayuda a detectar errores de integración.

**Negativas:**

* Debe actualizarse si cambian endpoints.
* No reemplaza pruebas automatizadas.

