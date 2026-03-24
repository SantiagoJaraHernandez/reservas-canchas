# Architecture Decision Records (ADR)
## Proyecto: reservas-canchas-api — Release 2

**Fecha:** 2026-03-24
**Estado:** Propuesto
**Autores:** Equipo de Desarrollo Backend
**Proyecto:** reservas-canchas — Sistema de Gestión de Reservas de Canchas Deportivas

---

## Tabla de Contenidos

1. [ADR-001 — Externalización de Configuración en el Gateway](#adr-001--externalización-de-configuración-en-el-gateway) *(corregido)*
2. [ADR-002 — Jerarquía de Excepciones de Dominio](#adr-002--jerarquía-de-excepciones-de-dominio) *(corregido)*
3. [ADR-003 — Contenedorización Completa con Docker](#adr-003--contenedorización-completa-con-docker) *(reemplazado)*
4. [ADR-004 — Separación de Base de Datos por Microservicio](#adr-004--separación-de-base-de-datos-por-microservicio-polyglot-persistence) ⭐ recomendado
5. [ADR-005 — Gateway como Proxy Transparente sin Lógica de Negocio](#adr-005--gateway-como-proxy-transparente-sin-lógica-de-negocio) ⭐ recomendado
6. [ADR-006 — Migraciones Versionadas con Flyway](#adr-006--migraciones-versionadas-con-flyway) ⭐ recomendado
7. [ADR-007 — Modelo de Roles Simples en el Token JWT](#adr-007--modelo-de-roles-simples-en-el-token-jwt)
8. [ADR-008 — DTO como Capa de Contrato en ms-reservas](#adr-008--dto-como-capa-de-contrato-en-ms-reservas)

---

## Nota Sobre la Corrección de los ADRs Anteriores

Los tres ADRs de Release 1 tenían un problema estructural común: **documentaban acciones realizadas, no decisiones tomadas**. Un ADR no es un changelog ni un resumen de commits. Su propósito es registrar por qué se tomó una decisión, qué alternativas existían y qué costo se aceptó al elegir. A continuación se presentan los tres corregidos con esa estructura completa.

Adicionalmente, el ADR-003 original documentaba Flyway pero el código del repositorio **no lo implementa** (no existe la dependencia en `pom.xml`, no hay directorio `db/migration` y `ddl-auto` sigue siendo `update`). Se reemplaza por el ADR real aplicado: la contenedorización con Docker.

---

## ADR-001 — Externalización de Configuración en el Gateway

**Fecha:** 2026-03-16
**Estado:** Implementado
**Decisores:** Equipo de backend

### Contexto

El `GatewayController` construía el `WebClient` con la URL de `ms-reservas` escrita directamente en el constructor del controlador:

```java
// ANTES — GatewayController.java
public GatewayController(WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder
        .baseUrl("http://localhost:8081")  // acoplado al entorno local
        .build();
}
```

Esto viola el Factor III de la metodología 12-Factor App: toda configuración que varía entre entornos debe provenir del entorno, no del código fuente. Con esta implementación el servicio no podía levantarse en Docker (donde la URL es `http://ms-reservas:8081`) sin modificar el código y recompilar.

Se identificó además el mismo antipatrón en CORS: los orígenes permitidos estaban hardcodeados en la anotación `@CrossOrigin` del controlador. **Nota: esta anotación aún permanece en el código actual como inconsistencia pendiente de resolver**, aunque `application.yml` ya externalizó la variable `${CORS_ORIGINS}`.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | `application.yml` + variable de entorno con `${}` de Spring | — Elegida |
| B | Spring Cloud Gateway + Eureka (Service Discovery) | Complejidad operacional desproporcionada para la etapa actual del proyecto |
| C | Mantener la URL hardcodeada | Bloquea cualquier despliegue fuera del entorno local |

### Decisión

**Opción A.** Externalizar la URL hacia `application.yml` usando el operador `${}` de Spring con valor fallback para desarrollo local. Se extrae la construcción del `WebClient` a una clase `WebClientConfig` y se agrega `GatewayProperties` para tipar la propiedad.

### Consecuencias

**Positivas:**
- El Gateway puede desplegarse en cualquier entorno (local, Docker, CI/CD) inyectando solo la variable de entorno `MS_RESERVAS_URL`.
- Sienta las bases para migrar a Spring Cloud Gateway + Eureka en releases futuros sin cambiar el contrato de configuración.
- La URL deja de ser un secreto embebido en código versionado.

**Negativas / costo aceptado:**
- El equipo debe mantener un inventario de variables de entorno esperadas por servicio (idealmente en un `.env.example`).
- Si `MS_RESERVAS_URL` no se define en producción, el fallback apunta a `localhost` y el error es silencioso hasta que se intenta una petición real.
- La anotación `@CrossOrigin` hardcodeada en `GatewayController` **no fue eliminada**, por lo que CORS está externalizado en el yml pero ignorado en tiempo de ejecución. Queda como deuda para el siguiente sprint.

---

## ADR-002 — Jerarquía de Excepciones de Dominio

**Fecha:** 2026-03-16
**Estado:** Implementado
**Decisores:** Equipo de backend

### Contexto

`ReservaService` lanzaba `RuntimeException` genérica para todos los errores de negocio. El `GlobalExceptionHandler` tenía un único handler `@ExceptionHandler(RuntimeException.class)` que respondía siempre `400 Bad Request` sin distinción de causa:

```java
// ANTES — ReservaService.java
.orElseThrow(() -> new RuntimeException("Reserva no encontrada"));   // debería ser 404
throw new RuntimeException("La cancha ya esta reservada...");         // debería ser 409

// ANTES — GlobalExceptionHandler.java
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<?> handleRuntime(RuntimeException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(...);   // 400 para todo
}
```

Esto rompe la semántica HTTP: un cliente que recibe `400` asume que envió datos inválidos, no que el recurso no existe o que hay un conflicto de negocio. El frontend no puede diferenciar los casos sin parsear el mensaje de texto.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Excepciones tipadas por caso de negocio, cada una mapeada a un HTTP status específico | — Elegida |
| B | Enum centralizado con código HTTP y mensaje | Acopla la capa de servicio directamente a conceptos HTTP, lo que rompe la separación de capas |
| C | Detectar por texto del mensaje en el handler (`if msg.contains("no encontrada")`) | Frágil, no tipado, imposible de testear con garantías |

### Decisión

**Opción A.** Crear `ReservaNotFoundException` (→ 404) y `CanchaOcupadaException` (→ 409) como clases propias del dominio. Reescribir `GlobalExceptionHandler` con handlers específicos para cada excepción más un handler genérico `Exception.class` para errores no controlados (→ 500).

### Consecuencias

**Positivas:**
- Las respuestas HTTP son semánticamente correctas: 404, 409, 400 y 500 tienen significados distintos y diferenciables.
- El frontend puede implementar lógica distinta para cada código sin parsear mensajes de texto.
- Los errores de sistema (NullPointerException, etc.) quedan separados de los errores de negocio y responden 500 en lugar de 400.
- Los mensajes son descriptivos e incluyen contexto (id, cancha, fecha, horario).

**Negativas / costo aceptado:**
- Cada nuevo caso de error de negocio requiere su propia clase de excepción y su propio handler.
- Tests unitarios existentes que esperaban `400` para el caso "no encontrada" deben actualizarse a `404`.
- La corrección del typo `exeption → exception` (que formaba parte del ADR original) **no es una decisión arquitectural** y no debería haber figurado aquí. Es una deuda de limpieza que se resuelve como parte del refactor pero no justifica un ADR.

---

## ADR-003 — Contenedorización Completa con Docker

**Fecha:** 2026-03-16
**Estado:** Implementado
**Decisores:** Equipo de backend

### Contexto

El `docker-compose.yml` original solo contenía `postgres` y `pgadmin`. Los servicios `ms-reservas` y `gateway` se ejecutaban únicamente en modo local con `mvn spring-boot:run`. Esto hacía imposible reproducir el sistema completo en otro equipo o entorno sin instalar Java, Maven y conocer el orden correcto de arranque.

Con la incorporación de `ms-auth` (nuevo microservicio con MongoDB) en esta iteración, el problema se agravó: el sistema pasó a tener tres servicios de aplicación más dos bases de datos, todos con dependencias de arranque entre sí.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Docker Compose con Dockerfile por servicio (multi-stage build) | — Elegida |
| B | Kubernetes desde esta etapa | Complejidad operacional alta; K8s no aporta valor diferencial cuando el equipo aún itera el diseño de los servicios |
| C | Scripts de arranque manual con instrucciones en README | No es reproducible, depende del entorno local de cada desarrollador |

### Decisión

**Opción A.** Crear un `Dockerfile` de multi-stage build para cada microservicio (`ms-reservas`, `gateway`, `ms-auth`) y actualizar `docker-compose.yml` para incluir los tres servicios de aplicación más `mongodb`, con variables de entorno y dependencias de arranque (`depends_on`) explícitas.

El multi-stage build se eligió sobre un build de única etapa para evitar incluir Maven y el JDK completo en la imagen de producción. La imagen final usa solo el JRE (`eclipse-temurin:17-jre-alpine`), reduciendo el tamaño considerablemente.

### Consecuencias

**Positivas:**
- Cualquier persona con Docker puede levantar el sistema completo con un solo comando: `docker-compose up`.
- El orden de arranque está declarado explícitamente: `gateway → ms-reservas → postgres` y `ms-auth → mongodb`.
- Las variables de entorno en `docker-compose.yml` reemplazan los valores hardcodeados de desarrollo local.
- Las imágenes de producción son livianas al excluir el toolchain de compilación.

**Negativas / costo aceptado:**
- El primer `docker-compose up` es lento porque Maven descarga todas las dependencias dentro del contenedor de build.
- `depends_on` en Docker Compose garantiza el orden de inicio de los contenedores, pero no que el servicio dentro del contenedor esté listo para recibir peticiones. Si `postgres` tarda en inicializar, `ms-reservas` puede fallar en el primer arranque. Requiere política de reintentos o `restart: always` (que ya está configurado).
- Cada desarrollador necesita Docker instalado; ya no es posible contribuir al proyecto solo con Java y Maven.

---

## Nuevos ADRs — Release 2

Los siguientes cinco ADRs documentan decisiones ya tomadas en el repositorio actual que no estaban formalizadas. Se recomienda implementar los marcados con ⭐.

---

## ADR-004 — Separación de Base de Datos por Microservicio (Polyglot Persistence) ⭐

**Fecha:** 2026-03-24
**Estado:** Implementado, pendiente de documentar
**Decisores:** Equipo de backend

### Contexto

Al incorporar `ms-auth` surgió la necesidad de elegir la base de datos para el nuevo microservicio. El sistema ya tenía PostgreSQL corriendo para `ms-reservas`. La decisión más simple habría sido reutilizarla. En cambio, se eligió MongoDB para `ms-auth`, introduciendo dos motores de persistencia distintos en el mismo sistema.

Esta elección tiene implicaciones operacionales importantes y merece quedar documentada.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Una sola base PostgreSQL, tabla `usuarios` junto a `reservas` | Acopla los microservicios a una BD compartida: un cambio de esquema en auth puede afectar reservas. Viola el principio de base de datos por servicio. |
| B | PostgreSQL para `ms-reservas`, MongoDB para `ms-auth` | — Elegida |
| C | MongoDB para ambos servicios | `ms-reservas` tiene una consulta de solapamiento de horarios que se beneficia de índices relacionales y JPQL. MongoDB haría esa query más compleja sin ganancia real. |

### Decisión

**Opción B.** Cada microservicio gestiona su propia base de datos con el motor que mejor encaja con su modelo de datos:

- `ms-reservas` usa **PostgreSQL**: los datos de reservas tienen estructura fija, relaciones claras y requieren una consulta de rango/solapamiento que se expresa de forma natural en SQL con índices.
- `ms-auth` usa **MongoDB**: los usuarios son documentos autocontenidos sin relaciones entre sí. El esquema es simple (email, password hash, rol) y puede evolucionar fácilmente si se agregan claims o metadata sin migraciones de esquema.

### Consecuencias

**Positivas:**
- Ningún microservicio comparte base de datos con otro: un cambio de esquema en auth no afecta reservas.
- Cada servicio puede escalar su base de datos de forma independiente.
- El modelo de usuario como documento encaja con MongoDB; no se fuerza un esquema relacional donde no hay relaciones.

**Negativas / costo aceptado:**
- Dos motores de base de datos para operar, monitorear y respaldar.
- Mayor complejidad en `docker-compose.yml` (se requieren dos servicios de BD: `postgres` y `mongodb`).
- No es posible hacer joins entre datos de ambas bases, lo cual es aceptable porque no existe ningún caso de uso que requiera cruzar usuarios con reservas en una sola query.

---

## ADR-005 — Gateway como Proxy Transparente sin Lógica de Negocio ⭐

**Fecha:** 2026-03-24
**Estado:** Implementado, pendiente de documentar
**Decisores:** Equipo de backend

### Contexto

Al diseñar el Gateway surgió la pregunta de cuánta responsabilidad debería asumir: ¿solo enruta peticiones, o también valida tokens, agrega respuestas de varios servicios o transforma payloads? El `GatewayController` actual reenvía todas las peticiones a `ms-reservas` sin validar ni transformar nada, y propaga los códigos HTTP que recibe downstream a través de `GatewayException`.

Esta decisión tiene impacto directo en la seguridad del sistema: actualmente **cualquier petición sin token llega a `ms-reservas`**.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Gateway inteligente: valida JWT, agrega respuestas de múltiples servicios, transforma payloads | `ms-auth` todavía no está integrado con el Gateway. Agregar validación JWT antes de que ese canal esté definido crearía acoplamiento prematuro y bloquearía el desarrollo de reservas. |
| B | Gateway proxy puro: solo enruta, propaga errores HTTP, no valida contenido | — Elegida para esta iteración |
| C | Eliminar el Gateway y que el frontend llame directamente a cada microservicio | Expone los puertos internos de cada servicio al exterior. Elimina el punto único de entrada y complica futuros cambios de topología. |

### Decisión

**Opción B.** El Gateway actúa como proxy transparente en esta iteración. La validación JWT se implementará en la Weekly 7 como filtro sobre todas las rutas protegidas.

### Consecuencias

**Positivas:**
- El desarrollo de `ms-reservas` puede avanzar sin esperar a que el canal de autenticación esté finalizado.
- El Gateway es simple y fácil de razonar: cada endpoint del controlador mapea directamente a un endpoint del downstream.
- La propagación de errores HTTP mediante `GatewayException` garantiza que los códigos de estado del downstream llegan correctamente al cliente.

**Negativas / costo aceptado:**
- **Los endpoints de reservas no están protegidos.** Cualquier cliente puede crear, modificar o eliminar reservas sin autenticación. Esto es una deuda de seguridad explícita aceptada hasta la Weekly 7.
- La lógica de routing está en un `@RestController` Java en lugar de un archivo de configuración declarativo (Spring Cloud Gateway). Si el número de servicios downstream crece, mantener el proxy manualmente se vuelve costoso.

---

## ADR-006 — Migraciones Versionadas con Flyway ⭐

**Fecha:** 2026-03-24
**Estado:** Propuesto — pendiente de implementar
**Decisores:** Equipo de backend

### Contexto

`ms-reservas` usa `hibernate.ddl-auto: update` con `show-sql: true` activos en todos los entornos, incluyendo producción. Con `ddl-auto: update`, Hibernate compara las anotaciones JPA contra el esquema actual de la base de datos y aplica los `ALTER TABLE` que considera necesarios al arrancar. No registra qué cambios hizo, no permite rollback y puede ejecutarse en condición de carrera si dos instancias arrancan simultáneamente.

```yaml
# ms-reservas/src/main/resources/application.yml — estado actual
jpa:
  hibernate:
    ddl-auto: update    # Hibernate modifica el esquema al arrancar sin historial
  show-sql: true        # Imprime todas las queries en producción
```

**Nota importante:** este ADR se incluyó en el documento de Release 1 pero **no fue implementado**. No existe la dependencia Flyway en `pom.xml` ni el directorio `db/migration`. Se propone formalmente aquí para Release 2.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Mantener `ddl-auto: update` | Riesgo real de pérdida o corrupción de datos si se renombra una columna o cambia un tipo. Inaceptable pasando de desarrollo a un entorno con datos reales. |
| B | `ddl-auto: validate` sin herramienta de migración | Valida que el esquema coincida pero no lo gestiona. El DBA debe aplicar cambios manualmente. Sin historial auditable. |
| C | Flyway con scripts SQL versionados | — Elegida |
| D | Liquibase | Misma capacidad que Flyway pero mayor verbosidad (XML/YAML). Para la escala actual, Flyway es suficiente y más simple. |

### Decisión

**Opción C.** Adoptar Flyway para gestionar el ciclo de vida del esquema con migraciones SQL versionadas, auditables y reproducibles. Cambiar `ddl-auto` a `validate` para que Hibernate solo verifique consistencia entre entidad y esquema, sin modificarlo. Separar `show-sql` a un perfil de desarrollo.

### Implementación

#### 1. Agregar dependencias en `ms-reservas/pom.xml`

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

#### 2. Actualizar `application.yml`

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5433/reservasdb}
    username: ${DB_USER:reservas}
    password: ${DB_PASS:reservas123}
  jpa:
    hibernate:
      ddl-auto: validate       # Hibernate solo valida, Flyway gestiona el esquema
    show-sql: false            # Desactivar en producción
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true  # Necesario porque la BD ya tiene datos de Release 1
```

#### 3. Crear migración inicial

```
ms-reservas/src/main/resources/db/migration/
└── V1__crear_tabla_reservas.sql
```

```sql
-- V1__crear_tabla_reservas.sql
CREATE TABLE IF NOT EXISTS reservas (
    id              BIGSERIAL    PRIMARY KEY,
    id_usuario      BIGINT       NOT NULL,
    id_cancha       BIGINT       NOT NULL,
    fecha           DATE         NOT NULL,
    hora_inicio     TIME         NOT NULL,
    hora_fin        TIME         NOT NULL,
    estado          VARCHAR(20),
    fecha_creacion  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservas_cancha_fecha
    ON reservas (id_cancha, fecha);
```

#### Convención de nombrado para migraciones futuras

```
V1__crear_tabla_reservas.sql          ← base Release 1
V2__agregar_columna_notas.sql         ← ejemplo Release 2
V3__crear_tabla_canchas.sql           ← ejemplo futuro
```

Reglas: prefijo `V` + número + doble guion + descripción en snake_case. Nunca modificar un archivo ya ejecutado (Flyway valida el checksum y falla si difiere).

### Consecuencias

**Positivas:**
- Historial completo y auditable de todos los cambios de esquema en la tabla `flyway_schema_history`.
- El esquema es reproducible en cualquier entorno partiendo de cero.
- Flyway usa un lock en la BD para evitar race conditions si varias instancias arrancan simultáneamente.
- `ddl-auto: validate` detecta inconsistencias entre la entidad JPA y el esquema real al iniciar la aplicación, fallando rápido si hay divergencia.

**Negativas / costo aceptado:**
- El equipo debe crear un archivo `Vx__` por cada cambio estructural en las entidades JPA. Un olvido no bloquea el arranque (`ddl-auto: validate` sí lo detecta, pero solo si la columna fue eliminada o renombrada, no si falta agregarla).
- Los scripts una vez ejecutados son inmutables. Los errores se corrigen con un script adicional, no editando el original.
- Requiere coordinación de numeración de versiones entre desarrolladores que trabajen en paralelo sobre el esquema.

---

## ADR-007 — Modelo de Roles Simples en el Token JWT

**Fecha:** 2026-03-24
**Estado:** Implementado, pendiente de documentar
**Decisores:** Equipo de backend

### Contexto

Al diseñar `ms-auth` se debió decidir cómo representar los permisos de usuario en el token JWT. El sistema tiene dos tipos de usuario previstos: `USER` (acceso a sus propias reservas) y `ADMIN` (acceso completo). `JwtService` incluye el claim `role` como string simple. `AuthService` asigna `"USER"` hardcodeado a todo usuario registrado. No existe un endpoint para asignar el rol `ADMIN`.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Sin roles por ahora, agregar después al token | Si el Gateway implementa filtros JWT en la Weekly 7 sin el claim `role`, habrá que cambiar el contrato del token y revocar todos los tokens existentes. |
| B | String simple `role` en el claim JWT, expandible después | — Elegida |
| C | Lista de permisos granulares desde el inicio (`["RESERVA_READ", "RESERVA_WRITE", ...]`) | Over-engineering para dos roles en esta etapa. |

### Decisión

**Opción B.** Incluir el claim `role` como string en el token desde el inicio. Esto permite que el filtro JWT del Gateway (Weekly 7) lea el rol sin re-consultar la base de datos. El string `"USER"` puede expandirse a una lista de permisos en el futuro sin romper el contrato existente.

### Consecuencias

**Positivas:**
- El Gateway puede tomar decisiones de autorización leyendo el claim `role` del token sin llamadas adicionales a `ms-auth`.
- El contrato del token ya incluye el campo cuando se implemente la validación.

**Negativas / costo aceptado:**
- El rol `"USER"` está hardcodeado en `AuthService`. No hay endpoint para promover a `ADMIN`. Queda como deuda hasta implementar gestión de roles.
- El token incluye `userId`, `email` y `role` pero no tiene expiración configurable por rol. Un admin revocado seguirá siendo admin hasta que el token expire (24 horas).

---

## ADR-008 — DTO como Capa de Contrato en ms-reservas

**Fecha:** 2026-03-24
**Estado:** Implementado, pendiente de documentar
**Decisores:** Equipo de backend

### Contexto

`ReservaController` podría haber expuesto la entidad JPA `Reserva` directamente, tal como hacen muchos proyectos Spring Boot en etapa inicial. En cambio, se introdujo `ReservaDTO` como capa intermedia con métodos `fromEntity()` y `toEntity()` para la conversión.

### Opciones Evaluadas

| Opción | Descripción | Por qué se descartó |
|--------|-------------|---------------------|
| A | Exponer `Reserva` (entidad JPA) directamente en el controlador | Acopla el contrato HTTP al modelo de base de datos. Un cambio de columna en la BD rompe la API. |
| B | DTO manual con conversión explícita en la propia clase DTO | — Elegida |
| C | MapStruct para mapeo automático | Agrega una dependencia de compilación y un procesador de anotaciones que no se justifica con un solo modelo en esta escala. |

### Decisión

**Opción B.** Usar `ReservaDTO` con métodos estáticos `fromEntity()` y conversión `toEntity()`. El DTO tiene sus propias validaciones `@NotNull` separadas de la entidad, lo que permite controlar qué campos se aceptan en entrada y cuáles se exponen en la respuesta.

### Consecuencias

**Positivas:**
- El contrato HTTP está desacoplado del modelo de persistencia. Se puede cambiar el nombre de una columna sin romper la API.
- Las validaciones de entrada (`@NotNull`, `@Valid`) viven en el DTO, no en la entidad JPA.
- `estado` y `fechaCreacion` pueden ser ignorados en la entrada (el servicio los asigna) aunque el DTO los expone en la respuesta.

**Negativas / costo aceptado:**
- La conversión manual debe mantenerse sincronizada con la entidad. Si se agrega un campo a `Reserva`, el DTO y sus dos métodos deben actualizarse manualmente.
- `ReservaDTO` actualmente expone todos los campos en la respuesta incluyendo `fechaCreacion` e `id`, que podrían no ser relevantes en todos los contextos. No hay DTOs diferenciados para entrada y salida.

---

## Resumen y Recomendación

### Los 5 ADRs nuevos evaluados

| ADR | Decisión | Estado en el repo | Recomendación |
|-----|----------|-------------------|---------------|
| ADR-004 | Polyglot persistence (PostgreSQL + MongoDB) | Implementado | ⭐ Documentar — decisión de alto impacto arquitectural visible en el compose |
| ADR-005 | Gateway proxy puro sin validación JWT | Implementado | ⭐ Documentar — deja explícita la deuda de seguridad de Weekly 7 |
| ADR-006 | Migraciones versionadas con Flyway | **No implementado** | ⭐ Implementar — el único de los cinco que requiere código nuevo, pero cierra el riesgo más alto para producción |
| ADR-007 | Roles simples en JWT como string | Implementado | Documentar en iteración posterior |
| ADR-008 | DTO como capa de contrato | Implementado | Documentar en iteración posterior |

### Por qué estos tres

**ADR-004** es la decisión más visible en la arquitectura: cualquiera que lea el `docker-compose.yml` verá dos bases de datos y preguntará por qué. Sin este ADR, la elección parece arbitraria.

**ADR-005** es necesario ahora porque deja por escrito que los endpoints **no están protegidos**, que es una decisión consciente y temporal, no un olvido. Esto protege al equipo frente a la revisión del profesor y deja claro el trabajo de la Weekly 7.

**ADR-006** es el único que requiere cambios en el código, pero es el que cierra el antipatrón más crítico del repo: `ddl-auto: update` en un sistema que ya tiene datos reales. Vale la pena implementarlo antes de la entrega.

---

## Referencias

- Fowler, M. (2004). *Patterns of Enterprise Application Architecture* — Repository, Service Layer, DTO
- Richardson, C. (2018). *Microservices Patterns* — Database per Service, API Gateway
- Nygard, M. (2007). *Release It!* — Stability Patterns
- Nolen, M. — *Documenting Architecture Decisions* (cognitect.com/blog)
- Spring Documentation — Externalized Configuration, Spring Data JPA
- Flyway Documentation — Migration Versioning (documentation.red-gate.com)
- RFC 9110 — HTTP Semantics — Códigos de estado 4xx y 5xx
- The Twelve-Factor App — Factor III: Config (12factor.net)

---

*Documento generado para reservas-canchas-api — Sistema de Gestión de Reservas de Canchas Deportivas*
*Release 2 — Semestre 2026-1 | CORHUILA*