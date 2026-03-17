# Architecture Decision Records (ADR)
## Proyecto: reservas-canchas-api — Release 1

**Fecha:** 2026-03-16
**Estado:** Propuesto
**Autores:** Equipo de Desarrollo Backend
**Proyecto:** reservas-canchas — Sistema de Gestión de Reservas de Canchas Deportivas

---

## 📋 Tabla de Contenidos

1. [Identificación de Patrones y Antipatrones](#1-identificación-de-patrones-y-antipatrones)
2. [ADRs Candidatos](#2-adrs-candidatos)
3. [ADR-001 — Externalización de Configuración en el Gateway](#adr-001--externalización-de-configuración-en-el-gateway)
4. [ADR-002 — Jerarquía de Excepciones de Dominio](#adr-002--jerarquía-de-excepciones-de-dominio)
5. [ADR-003 — Migraciones Versionadas con Flyway](#adr-003--migraciones-versionadas-con-flyway)
6. [Resumen Ejecutivo](#resumen-ejecutivo)

---

## 1. Identificación de Patrones y Antipatrones

### 1.1 Patrones Actualmente Implementados

| Patrón | Ubicación | Descripción |
|--------|-----------|-------------|
| **Repository Pattern** | `ReservaRepository` | Abstracción de acceso a datos con `JpaRepository` |
| **DTO Pattern** | `ReservaDTO` | Transferencia de datos entre capas con conversión `toEntity()` / `fromEntity()` |
| **Service Layer** | `ReservaService` | Lógica de negocio separada del controlador |
| **Global Exception Handler** | `GlobalExceptionHandler` | Captura centralizada de excepciones con `@RestControllerAdvice` |
| **Gateway/Proxy Pattern** | `GatewayController` | Enrutamiento reactivo con WebFlux hacia `ms-reservas` |

### 1.2 Antipatrones Identificados

#### Antipatrón 1: Hardcoded Infrastructure (Magic URL)

**Ubicación:** `GatewayController.java` — constructor

```java
// PROBLEMA: URL acoplada al entorno de desarrollo
public GatewayController(WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder.baseUrl("http://localhost:8081").build();
}
```

**Efecto:** El servicio no puede desplegarse en ningún entorno sin recompilar.

---

#### Antipatrón 2: Exception Swallowing / Generic Exception

**Ubicación:** `ReservaService.java` + `GlobalExceptionHandler.java`

```java
// PROBLEMA: Toda falla de negocio lanza el mismo tipo
throw new RuntimeException("Reserva no encontrada");
throw new RuntimeException("La cancha ya esta reservada en ese horario");

// PROBLEMA: Todo RuntimeException a 400 Bad Request
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<?> handleRuntime(RuntimeException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(...);
}
```

**Efecto:** `"Reserva no encontrada"` deberia ser `404`. `"Cancha ocupada"` deberia ser `409`. Ambos llegan como `400`, rompiendo la semantica HTTP.

---

#### Antipatrón 3: Mutable Schema Without Version Control

**Ubicación:** `ms-reservas/src/main/resources/application.yml`

```yaml
jpa:
  hibernate:
    ddl-auto: update   # Hibernate modifica el esquema solo al arrancar
  show-sql: true       # Imprime todas las queries en produccion
```

**Efecto:** En produccion, una columna puede ser renombrada, eliminada o creada sin revision humana ni historial de cambios.

---

#### Antipatrón 4: CORS Hardcoded en Controlador

**Ubicación:** `GatewayController.java`

```java
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176"})
```

**Efecto:** Los origenes permitidos estan escritos en codigo fuente; agregar el dominio de produccion requiere un nuevo despliegue.

---

#### Antipatrón 5: Typo en Nombre de Paquete

**Ubicación:** `ms-reservas/src/main/java/com/reservas/ms_reservas/exeption/`

```
exeption/   <- typo (falta la 'c')
exception/  <- correcto
```

**Efecto:** Inconsistencia que puede confundir al IDE, las busquedas y las reglas de importacion automatica.

---

## 2. ADRs Candidatos

| ADR ID | Titulo | Prioridad | Razon |
|--------|--------|-----------|-------|
| **ADR-001** | Externalizacion de configuracion en el Gateway | Alta | El servicio no puede desplegarse sin recompilar |
| **ADR-002** | Jerarquia de excepciones de dominio tipadas | Alta | Respuestas HTTP semanticamente incorrectas |
| **ADR-003** | Migraciones versionadas con Flyway | Alta | Riesgo de corrupcion de esquema en produccion |
| ADR-004 | CORS externalizado a configuracion | Media | Origenes hardcodeados impiden despliegue productivo |
| ADR-005 | Correccion del nombre del paquete `exeption` | Baja | Deuda tecnica menor, facil de resolver |

---

## ADR-001 — Externalizacion de Configuracion en el Gateway

**Fecha:** 2026-03-16
**Estado:** Propuesto
**Decisores:** Equipo de backend

---

### Contexto

El `GatewayController` construye el `WebClient` con la URL del microservicio `ms-reservas` escrita directamente en el codigo fuente:

```java
// GatewayController.java — Estado actual
@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176"})
public class GatewayController {

    private final WebClient webClient;

    public GatewayController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("http://localhost:8081")  // URL y puerto acoplados al entorno
            .build();
    }
}
```

El sistema viola el **Factor III** de la metodologia 12-Factor App: *"Store config in the environment"*. Toda configuracion que varia entre entornos (dev, staging, prod) debe provenir del entorno, no del codigo fuente.

### Estado Actual de la Arquitectura

```
+------------------------------------------------------------------+
|                    ARQUITECTURA ACTUAL                           |
+------------------------------------------------------------------+
|                                                                  |
|  Cliente Frontend                                                |
|  (localhost:5173)                                                |
|       |                                                          |
|       v                                                          |
|  +-----------------------------------------------------------+   |
|  |              Gateway  :8080                               |   |
|  |                                                           |   |
|  |  GatewayController                                        |   |
|  |  +-----------------------------------------------------+  |   |
|  |  |  webClient.baseUrl("http://localhost:8081")  <-- [!] |  |   |
|  |  |                       ^                             |  |   |
|  |  |               HARDCODED en codigo                   |  |   |
|  |  +-----------------------------------------------------+  |   |
|  +-----------------------------------------------------------+   |
|       |                                                          |
|       |  HTTP directo localhost:8081                             |
|       v                                                          |
|  +----------------------+                                        |
|  |   ms-reservas :8081  |                                        |
|  +----------------------+                                        |
|                                                                  |
|  [!] En Docker la URL cambia a http://ms-reservas:8081           |
|  [!] En produccion el puerto y host son distintos                |
|  [!] Resultado: hay que modificar codigo y recompilar            |
|                                                                  |
+------------------------------------------------------------------+
```

### Opciones Evaluadas

| Opcion | Descripcion | Pros | Contras |
|--------|-------------|------|---------|
| **A — `application.yml` + variable de entorno** | Propiedad con fallback a valor local | Simple, sin dependencias nuevas, compatible con Docker | No tiene balanceo ni discovery automatico |
| **B — Spring Cloud Gateway + Eureka** | Service Discovery con registro dinamico | Escalable, balanceo automatico, tolerancia a fallos | Complejidad operacional alta para Release 2 |
| **C — Continuar con URL hardcodeada** | Sin cambios | Ninguno | Bloquea cualquier despliegue que no sea local |

### Decision

**Opcion A:** Externalizar la URL a `application.yml` con soporte de variable de entorno mediante el operador `${}` de Spring, con valor por defecto para entorno local.

### Arquitectura Propuesta

```
+------------------------------------------------------------------+
|                    ARQUITECTURA PROPUESTA                        |
+------------------------------------------------------------------+
|                                                                  |
|  application.yml / Variables de Entorno                          |
|  +------------------------------------------------------------+  |
|  |  ms-reservas.base-url: ${MS_RESERVAS_URL:localhost:8081}   |  |
|  |  cors.allowed-origins: ${CORS_ORIGINS:localhost:5173}      |  |
|  +----------------------------+-------------------------------+  |
|                               | @Value / @ConfigurationProperties|
|                               v                                  |
|  +------------------------------------------------------------+  |
|  |              Gateway  :8080                                |  |
|  |  WebClientConfig                                           |  |
|  |  +--------------------------------------------------------+|  |
|  |  |  @Bean WebClient -> baseUrl(msReservasUrl)  [OK]       ||  |
|  |  +--------------------------------------------------------+|  |
|  +------------------------------+-----------------------------+  |
|                                 |                                |
|          +--------------+-------+----------+                     |
|          | Local        | Docker           | Produccion          |
|          v              v                  v                     |
|    localhost:8081  ms-reservas:8081   https://api:8081           |
|                                                                  |
+------------------------------------------------------------------+
```

### Implementacion Paso a Paso

#### Paso 1 — Actualizar `gateway/src/main/resources/application.yml`

```yaml
server:
  port: 8080

ms-reservas:
  base-url: ${MS_RESERVAS_URL:http://localhost:8081}

cors:
  allowed-origins: ${CORS_ORIGINS:http://localhost:5173,http://localhost:5176}
```

#### Paso 2 — Crear clase de propiedades tipadas

```java
// gateway/src/main/java/com/reservas/gateway/config/GatewayProperties.java
package com.reservas.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ms-reservas")
public class GatewayProperties {

    private String baseUrl;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
}
```

#### Paso 3 — Crear `WebClientConfig` como Bean centralizado

```java
// gateway/src/main/java/com/reservas/gateway/config/WebClientConfig.java
package com.reservas.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    private final GatewayProperties props;

    public WebClientConfig(GatewayProperties props) {
        this.props = props;
    }

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
            .baseUrl(props.getBaseUrl())
            .build();
    }
}
```

#### Paso 4 — Refactorizar `GatewayController` para recibir el bean inyectado

```java
// ANTES
public GatewayController(WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder.baseUrl("http://localhost:8081").build();
}

// DESPUES
@RestController
@RequestMapping
public class GatewayController {

    private final WebClient webClient;

    // Inyectado desde WebClientConfig — sin acoplamiento a la URL
    public GatewayController(WebClient webClient) {
        this.webClient = webClient;
    }
    // ... resto de metodos sin cambios
}
```

#### Paso 5 — Actualizar `infra/docker-compose.yml`

```yaml
version: '3.9'
services:

  postgres:
    image: postgres:15
    container_name: reservas-postgres
    environment:
      POSTGRES_DB: reservasdb
      POSTGRES_USER: reservas
      POSTGRES_PASSWORD: reservas123
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ms-reservas:
    build: ./ms-reservas
    container_name: ms-reservas
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/reservasdb
      SPRING_DATASOURCE_USERNAME: reservas
      SPRING_DATASOURCE_PASSWORD: reservas123
    ports:
      - "8081:8081"
    depends_on:
      - postgres

  gateway:
    build: ./gateway
    container_name: gateway
    environment:
      MS_RESERVAS_URL: http://ms-reservas:8081       # Nombre del servicio Docker
      CORS_ORIGINS: http://localhost:5173,http://localhost:5176
    ports:
      - "8080:8080"
    depends_on:
      - ms-reservas

volumes:
  postgres_data:
```

### Estructura de Archivos Afectados

```
gateway/src/main/java/com/reservas/gateway/
+-- GatewayApplication.java
+-- GatewayController.java          <- MODIFICADO (eliminar new WebClient)
+-- config/                         <- NUEVO paquete
    +-- GatewayProperties.java      <- NUEVO
    +-- WebClientConfig.java        <- NUEVO

gateway/src/main/resources/
+-- application.yml                 <- MODIFICADO

infra/
+-- docker-compose.yml              <- MODIFICADO (agregar servicios completos)
```

### Metricas de Impacto

```
+-------------------------------------------------------------------+
|                  COMPARATIVA DE DESPLIEGUE                        |
+-------------------------------------------------------------------+
|                                                                   |
|  ANTES (URL hardcodeada):                                         |
|  +-- Entorno local:      [OK]  Funciona                           |
|  +-- Docker Compose:     [!!]  Falla (localhost != ms-reservas)   |
|  +-- Staging:            [!!]  Requiere editar codigo + recompilar|
|  +-- Produccion:         [!!]  Requiere editar codigo + recompilar|
|                                                                   |
|  DESPUES (URL externalizada):                                     |
|  +-- Entorno local:      [OK]  Funciona (fallback en yml)         |
|  +-- Docker Compose:     [OK]  Funciona (env var en compose)      |
|  +-- Staging:            [OK]  Funciona (env var en CI/CD)        |
|  +-- Produccion:         [OK]  Funciona (env var en servidor)     |
|                                                                   |
|  Archivos nuevos:      2  (GatewayProperties, WebClientConfig)    |
|  Archivos modificados: 3  (Controller, yml, docker-compose)       |
|  Lineas eliminadas:    1  (la URL hardcodeada)                    |
|  Lineas agregadas:    ~35                                         |
|                                                                   |
+-------------------------------------------------------------------+
```

### Riesgos y Mitigacion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| Variable de entorno no definida al desplegar | Media | Alto | Usar valor fallback en `application.yml` |
| Conflicto de nombre de red en Docker | Baja | Medio | Verificar que el nombre del servicio en compose coincida con la URL |
| Tests de integracion que usen `localhost:8081` fallaran | Media | Bajo | Actualizar `application-test.yml` con la URL del contexto de test |

### Plan de Implementacion

```
Sprint 1:
+-- Crear GatewayProperties.java
+-- Crear WebClientConfig.java
+-- Refactorizar GatewayController (eliminar new WebClient en constructor)
+-- Actualizar application.yml con propiedades externalizadas
+-- Actualizar docker-compose.yml con variables de entorno por servicio

Validacion:
+-- Levantar con docker-compose y verificar que gateway resuelve ms-reservas
+-- Confirmar que en local (sin variables) usa el fallback localhost:8081
```

### Consecuencias

**Positivas:**
- [OK] El Gateway puede desplegarse en cualquier entorno sin modificar codigo fuente.
- [OK] Compatible con Docker Compose, Kubernetes y pipelines CI/CD.
- [OK] Sienta la base para migrar a Spring Cloud Gateway + Eureka en releases futuros.
- [OK] Elimina tambien los origenes CORS hardcodeados del controlador.

**Negativas:**
- [!!] El equipo debe mantener un inventario de variables de entorno por servicio (README o `.env.example`).
- [!!] Si la variable no se define en produccion, el fallback apuntara a localhost y causara errores silenciosos.

---

## ADR-002 — Jerarquia de Excepciones de Dominio

**Fecha:** 2026-03-16
**Estado:** Propuesto
**Decisores:** Equipo de backend

---

### Contexto

`ReservaService.java` lanza `RuntimeException` con mensajes en texto plano para todos los errores de negocio. El `GlobalExceptionHandler` captura cualquier `RuntimeException` y responde siempre con `400 Bad Request`:

```java
// ReservaService.java — Estado actual
public Reserva obtener(Long id) {
    return reservaRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));  // Deberia ser 404
}

public Reserva crear(Reserva reserva) {
    var solapadas = reservaRepository.findSolapadas(...);
    if (!solapadas.isEmpty()) {
        throw new RuntimeException("La cancha ya esta reservada en ese horario"); // Deberia ser 409
    }
}

// GlobalExceptionHandler.java — Estado actual
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<?> handleRuntime(RuntimeException ex) {
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)   // 400 para TODOS los errores sin distincion
        .body(Map.of("timestamp", ..., "message", ex.getMessage()));
}
```

### Estado Actual del Manejo de Errores

```
+-------------------------------------------------------------------+
|                   FLUJO DE ERRORES ACTUAL                         |
+-------------------------------------------------------------------+
|                                                                   |
|  ReservaService                                                   |
|  +---------------------------------------------------------+      |
|  |  obtener(id)    -> RuntimeException("Reserva no enc.") |      |
|  |  crear(reserva) -> RuntimeException("Cancha ocupada")  |      |
|  |  actualizar(id) -> RuntimeException("Reserva no enc.") |      |
|  |  eliminar(id)   -> RuntimeException("Reserva no enc.") |      |
|  +---------------------------+-----------------------------+      |
|                              |  todos lanzan RuntimeException     |
|                              v                                    |
|  GlobalExceptionHandler                                           |
|  +---------------------------------------------------------+      |
|  |                                                         |      |
|  |   RuntimeException ---------> 400 BAD REQUEST  [!!]    |      |
|  |                (todos juntos, sin distincion)           |      |
|  +---------------------------------------------------------+      |
|                                                                   |
|  [!!] "no encontrada"  -> deberia ser 404 NOT FOUND              |
|  [!!] "cancha ocupada" -> deberia ser 409 CONFLICT               |
|  [!!] NullPointerException del sistema -> tambien llega como 400 |
|                                                                   |
+-------------------------------------------------------------------+
```

### Opciones Evaluadas

| Opcion | Descripcion | Pros | Contras |
|--------|-------------|------|---------|
| **A — Excepciones tipadas por dominio** | Una clase por cada tipo de error de negocio | Semantica HTTP correcta, extensible, testeable | Requiere crear clases nuevas |
| **B — Enum de errores con codigo HTTP** | Un enum centralizado con codigo y mensaje | Centralizado | Acoplamiento entre capa de servicio y HTTP |
| **C — Detectar por mensaje de texto en el handler** | `if (ex.getMessage().contains("no encontrada"))` | Sin clases nuevas | Fragil, propenso a errores, no tipado |

### Decision

**Opcion A:** Crear una jerarquia de excepciones propias del dominio, cada una mapeada a un codigo HTTP especifico en el `GlobalExceptionHandler`.

### Diseño de la Jerarquia de Excepciones

```
+-------------------------------------------------------------------+
|               JERARQUIA DE EXCEPCIONES PROPUESTA                  |
+-------------------------------------------------------------------+
|                                                                   |
|                     RuntimeException (JDK)                        |
|                             |                                     |
|              +--------------+----------------+                    |
|              |                               |                    |
|   ReservaNotFoundException         CanchaOcupadaException         |
|   (extends RuntimeException)       (extends RuntimeException)     |
|   -> HTTP 404 NOT FOUND            -> HTTP 409 CONFLICT           |
|                                                                   |
|  GlobalExceptionHandler                                           |
|  +---------------------------------------------------------+      |
|  |                                                         |      |
|  |  ReservaNotFoundException    ------> 404 NOT FOUND [OK] |      |
|  |  CanchaOcupadaException      ------> 409 CONFLICT  [OK] |      |
|  |  MethodArgumentNotValidException --> 400 BAD REQ   [OK] |      |
|  |  Exception (cualquier otro)  ------> 500 SERVER    [OK] |      |
|  |                                                         |      |
|  +---------------------------------------------------------+      |
|                                                                   |
+-------------------------------------------------------------------+
```

### Implementacion Paso a Paso

#### Paso 1 — Renombrar el paquete con typo

```
# ANTES (typo)
ms-reservas/src/main/java/com/reservas/ms_reservas/exeption/

# DESPUES (correcto)
ms-reservas/src/main/java/com/reservas/ms_reservas/exception/
```

Actualizar el `package` en `GlobalExceptionHandler.java`:

```java
// ANTES
package com.reservas.ms_reservas.exeption;

// DESPUES
package com.reservas.ms_reservas.exception;
```

#### Paso 2 — Crear las excepciones de dominio

```java
// exception/ReservaNotFoundException.java
package com.reservas.ms_reservas.exception;

public class ReservaNotFoundException extends RuntimeException {

    private final Long id;

    public ReservaNotFoundException(Long id) {
        super("Reserva no encontrada con id: " + id);
        this.id = id;
    }

    public Long getId() {
        return id;
    }
}
```

```java
// exception/CanchaOcupadaException.java
package com.reservas.ms_reservas.exception;

import java.time.LocalDate;
import java.time.LocalTime;

public class CanchaOcupadaException extends RuntimeException {

    private final Long idCancha;

    public CanchaOcupadaException(Long idCancha, LocalDate fecha,
                                   LocalTime inicio, LocalTime fin) {
        super(String.format(
            "La cancha %d ya esta reservada el %s de %s a %s",
            idCancha, fecha, inicio, fin
        ));
        this.idCancha = idCancha;
    }

    public Long getIdCancha() {
        return idCancha;
    }
}
```

#### Paso 3 — Actualizar `ReservaService` para lanzar excepciones tipadas

```java
// ReservaService.java — ANTES
public Reserva obtener(Long id) {
    return reservaRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
}

// ReservaService.java — DESPUES
public Reserva obtener(Long id) {
    return reservaRepository.findById(id)
        .orElseThrow(() -> new ReservaNotFoundException(id));
}
```

```java
// ANTES
if (!solapadas.isEmpty()) {
    throw new RuntimeException("La cancha ya esta reservada en ese horario");
}

// DESPUES
if (!solapadas.isEmpty()) {
    throw new CanchaOcupadaException(
        reserva.getIdCancha(),
        reserva.getFecha(),
        reserva.getHoraInicio(),
        reserva.getHoraFin()
    );
}
```

#### Paso 4 — Reescribir `GlobalExceptionHandler` con handlers especificos

```java
// exception/GlobalExceptionHandler.java
package com.reservas.ms_reservas.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 — Recurso no encontrado
    @ExceptionHandler(ReservaNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ReservaNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(errorBody(ex.getMessage()));
    }

    // 409 — Conflicto de negocio (cancha ocupada)
    @ExceptionHandler(CanchaOcupadaException.class)
    public ResponseEntity<?> handleConflict(CanchaOcupadaException ex) {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(errorBody(ex.getMessage()));
    }

    // 400 — Validacion de campos (@Valid, @NotNull, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String campos = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorBody("Validacion fallida: " + campos));
    }

    // 500 — Error interno no controlado
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorBody("Error interno del servidor"));
    }

    private Map<String, Object> errorBody(String message) {
        return Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "message", message
        );
    }
}
```

### Estructura de Archivos Afectados

```
ms-reservas/src/main/java/com/reservas/ms_reservas/
+-- controller/
|   +-- ReservaController.java         (sin cambios)
+-- service/
|   +-- ReservaService.java            <- MODIFICADO (lanzar excepciones tipadas)
+-- exception/                         <- RENOMBRADO (era "exeption")
|   +-- GlobalExceptionHandler.java    <- MODIFICADO (handlers especificos)
|   +-- ReservaNotFoundException.java  <- NUEVO
|   +-- CanchaOcupadaException.java    <- NUEVO
+-- dto/
+-- model/
+-- repository/
```

### Comparativa de Respuestas HTTP

```
+-------------------------------------------------------------------+
|              RESPUESTAS HTTP: ANTES vs DESPUES                    |
+-------------------------------------------------------------------+
|                                                                   |
|  Escenario: GET /reservas/999 (no existe)                         |
|                                                                   |
|  ANTES:   HTTP 400 Bad Request  [!!]                              |
|           { "message": "Reserva no encontrada" }                  |
|                                                                   |
|  DESPUES: HTTP 404 Not Found    [OK]                              |
|           { "message": "Reserva no encontrada con id: 999" }      |
|                                                                   |
|  -----------------------------------------------------------      |
|                                                                   |
|  Escenario: POST /reservas (cancha ocupada en ese horario)        |
|                                                                   |
|  ANTES:   HTTP 400 Bad Request  [!!]                              |
|           { "message": "La cancha ya esta reservada..." }         |
|                                                                   |
|  DESPUES: HTTP 409 Conflict     [OK]                              |
|           { "message": "La cancha 3 ya esta reservada            |
|             el 2026-04-01 de 10:00 a 12:00" }                     |
|                                                                   |
|  -----------------------------------------------------------      |
|                                                                   |
|  Escenario: NullPointerException inesperado en el sistema         |
|                                                                   |
|  ANTES:   HTTP 400 Bad Request  [!!] (oculta el error real)       |
|           { "message": null }                                     |
|                                                                   |
|  DESPUES: HTTP 500 Internal Server Error  [OK]                    |
|           { "message": "Error interno del servidor" }             |
|                                                                   |
+-------------------------------------------------------------------+
```

### Riesgos y Mitigacion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| Tests unitarios que esperaban `400` para `not found` fallaran | Alta | Bajo | Actualizar assertions: `400` cambiar a `404` |
| Olvidar agregar handler para nueva excepcion futura | Media | Bajo | El handler `Exception.class` captura cualquier caso no contemplado |
| Renombrar paquete rompe importaciones existentes | Alta | Bajo | El IDE actualiza automaticamente; verificar con busqueda global |

### Plan de Implementacion

```
Sprint 1:
+-- Renombrar paquete "exeption" a "exception" (refactor IDE)
+-- Crear ReservaNotFoundException.java
+-- Crear CanchaOcupadaException.java
+-- Actualizar ReservaService.java (4 puntos de lanzamiento: obtener x3, crear x1)
+-- Reescribir GlobalExceptionHandler.java con 4 handlers especificos
+-- Actualizar tests unitarios para cada handler
```

### Consecuencias

**Positivas:**
- [OK] Respuestas HTTP semanticamente correctas: 404, 409, 400, 500.
- [OK] El frontend puede implementar logica diferenciada por codigo de error.
- [OK] Los errores de sistema quedan separados de los errores de negocio.
- [OK] Los mensajes de error son mas informativos (incluyen el id o detalle del conflicto).
- [OK] Correccion del typo en nombre de paquete.

**Negativas:**
- [!!] Requiere actualizar tests que esperaban `400` para el caso `not found`.
- [!!] Cada nueva excepcion de negocio requiere su propia clase y su propio handler.

---

## ADR-003 — Migraciones Versionadas con Flyway

**Fecha:** 2026-03-16
**Estado:** Propuesto
**Decisores:** Equipo de backend

---

### Contexto

El microservicio `ms-reservas` usa `ddl-auto: update` de Hibernate para gestionar el esquema de base de datos, junto con `show-sql: true` activo en todos los entornos:

```yaml
# ms-reservas/src/main/resources/application.yml — Estado actual
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/reservasdb
    username: reservas
    password: reservas123
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update    # Hibernate modifica el esquema al arrancar
    show-sql: true        # Imprime todas las queries en todos los entornos
```

Con `ddl-auto: update`, Hibernate compara el esquema actual de la base de datos contra las anotaciones JPA y aplica los `ALTER TABLE` que considere necesarios. No registra que cambios hizo, no permite rollback y puede ejecutarse en condiciones de carrera si dos instancias arrancan simultaneamente.

### Estado Actual del Ciclo de Vida del Esquema

```
+-------------------------------------------------------------------+
|               CICLO DE VIDA DEL ESQUEMA ACTUAL                    |
+-------------------------------------------------------------------+
|                                                                   |
|  Desarrollador modifica Reserva.java                              |
|       |                                                           |
|       | (agrega campo, renombra columna, etc.)                    |
|       v                                                           |
|  mvn spring-boot:run / deploy                                     |
|       |                                                           |
|       v                                                           |
|  Hibernate ddl-auto: update                                       |
|  +---------------------------------------------------------+      |
|  |  Columna nueva?      -> ADD COLUMN  (OK, funciona)      |      |
|  |  Columna renombrada? -> Ignora el renombre  [BUG]       |      |
|  |  Columna eliminada?  -> NO borra nada       [BASURA]    |      |
|  |  Tipo cambiado?      -> Puede fallar runtime [RIESGO]   |      |
|  +---------------------------------------------------------+      |
|       |                                                           |
|       v                                                           |
|  [!!] Sin historial de que se aplico                              |
|  [!!] Sin posibilidad de rollback                                 |
|  [!!] Sin reproducibilidad entre entornos                         |
|  [!!] show-sql:true -> queries en logs de produccion              |
|                                                                   |
+-------------------------------------------------------------------+
```

### Opciones Evaluadas

| Opcion | Descripcion | Pros | Contras |
|--------|-------------|------|---------|
| **A — `ddl-auto: validate`** | Solo valida que el esquema coincide, sin modificarlo | Sin riesgo de cambios accidentales | Sin historial; el DBA gestiona manualmente |
| **B — Flyway** | Migraciones versionadas con archivos SQL | Historial completo, reproducible, integrado con Spring Boot | El equipo debe escribir SQL explicito por cambio |
| **C — Liquibase** | Similar a Flyway pero en XML/YAML/JSON | Soporta rollback declarativo | Mayor verbosidad, curva de aprendizaje mas alta |
| **D — Mantener `ddl-auto: update`** | Sin cambios | Ninguno | Riesgo de perdida de datos en produccion |

### Decision

**Opcion B — Flyway:** Adoptar Flyway para gestionar el ciclo de vida del esquema con migraciones SQL versionadas, auditables y reproducibles.

### Arquitectura Propuesta con Flyway

```
+-------------------------------------------------------------------+
|              CICLO DE VIDA DEL ESQUEMA CON FLYWAY                 |
+-------------------------------------------------------------------+
|                                                                   |
|  Desarrollador modifica Reserva.java                              |
|       |                                                           |
|       | + crea V2__agregar_columna_notas.sql                      |
|       v                                                           |
|  mvn spring-boot:run / deploy                                     |
|       |                                                           |
|       v                                                           |
|  Flyway al arrancar:                                              |
|  +---------------------------------------------------------+      |
|  |  1. Lee tabla flyway_schema_history en PostgreSQL       |      |
|  |  2. Detecta que V2__ aun no fue aplicado                |      |
|  |  3. Ejecuta V2__agregar_columna_notas.sql               |      |
|  |  4. Registra en history con checksum + fecha            |      |
|  +---------------------------------------------------------+      |
|       |                                                           |
|       v                                                           |
|  [OK] Historial completo auditado en BD                           |
|  [OK] Idempotente: no re-ejecuta scripts ya aplicados             |
|  [OK] Reproducible en local, CI/CD y produccion                   |
|  [OK] Falla el arranque si un script fue modificado tras ejecutar |
|                                                                   |
|  flyway_schema_history (tabla en PostgreSQL):                     |
|  +--------+---------------------------------+-------------------+ |
|  |version |         description            |    installed_on    | |
|  +--------+---------------------------------+-------------------+ |
|  |   1    | crear tabla reservas           | 2026-01-10 09:00  | |
|  |   2    | agregar columna notas          | 2026-02-15 14:30  | |
|  |   3    | agregar indice cancha fecha    | 2026-03-16 10:00  | |
|  +--------+---------------------------------+-------------------+ |
|                                                                   |
+-------------------------------------------------------------------+
```

### Implementacion Paso a Paso

#### Paso 1 — Agregar dependencias Flyway en `ms-reservas/pom.xml`

```xml
<!-- pom.xml — agregar dentro de <dependencies> -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <!-- version gestionada por spring-boot-starter-parent -->
</dependency>

<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
    <!-- requerido a partir de Flyway 10 para soporte explicito de PostgreSQL -->
</dependency>
```

#### Paso 2 — Actualizar `application.yml` con perfiles por entorno

```yaml
# ms-reservas/src/main/resources/application.yml — PRODUCCION / DEFAULT
server:
  port: 8081

spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5433/reservasdb}
    username: ${DB_USER:reservas}
    password: ${DB_PASS:reservas123}
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate       # Hibernate solo valida, Flyway gestiona el esquema
    show-sql: false            # Desactivar en produccion
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true  # Util si la BD ya tiene datos de Release 1
```

```yaml
# ms-reservas/src/main/resources/application-dev.yml — DESARROLLO LOCAL
spring:
  jpa:
    show-sql: true             # Activar solo en dev
  flyway:
    enabled: true              # Flyway tambien en dev para consistencia
```

#### Paso 3 — Crear el directorio de migraciones y el script inicial

```
ms-reservas/src/main/resources/
+-- db/
    +-- migration/
        +-- V1__crear_tabla_reservas.sql
```

```sql
-- V1__crear_tabla_reservas.sql
-- Migracion inicial: crea la tabla principal del microservicio

CREATE TABLE IF NOT EXISTS reservas (
    id              BIGSERIAL       PRIMARY KEY,
    id_usuario      BIGINT          NOT NULL,
    id_cancha       BIGINT          NOT NULL,
    fecha           DATE            NOT NULL,
    hora_inicio     TIME            NOT NULL,
    hora_fin        TIME            NOT NULL,
    estado          VARCHAR(20),
    fecha_creacion  TIMESTAMP
);

-- Indice de solapamiento: optimiza la query findSolapadas del repository
CREATE INDEX IF NOT EXISTS idx_reservas_cancha_fecha
    ON reservas (id_cancha, fecha);
```

#### Paso 4 — Convencion de nombrado para migraciones futuras

```
db/migration/
+-- V1__crear_tabla_reservas.sql              <- Release 1 (migracion base)
+-- V2__agregar_indice_cancha_fecha.sql       <- Si se agrega por separado
+-- V3__agregar_columna_notas_reserva.sql     <- Release 2 ejemplo
+-- V4__crear_tabla_canchas.sql               <- Release 3 ejemplo
```

**Reglas:**
- Prefijo `V` + numero + doble guion + descripcion + `.sql`
- Nunca modificar un archivo ya ejecutado (Flyway valida el checksum y falla si difiere)
- Descripcion en snake_case, descriptiva del cambio realizado
- Un archivo por cambio logico (no agrupar cambios no relacionados)

#### Paso 5 — Estructura de archivos resultante

```
ms-reservas/src/main/
+-- java/com/reservas/ms_reservas/
|   +-- (sin cambios en codigo Java)
+-- resources/
    +-- application.yml                      <- MODIFICADO
    +-- application-dev.yml                  <- NUEVO
    +-- db/
        +-- migration/                       <- NUEVO directorio
            +-- V1__crear_tabla_reservas.sql <- NUEVO
```

### Comparativa de Comportamiento

```
+-------------------------------------------------------------------+
|          COMPORTAMIENTO: ddl-auto:update vs Flyway                |
+-------------------------------------------------------------------+
|                                                                   |
|  Escenario: se agrega campo `notas VARCHAR(500)` a Reserva.java   |
|                                                                   |
|  CON ddl-auto:update:                                             |
|  +-- Hibernate ejecuta ALTER TABLE reservas ADD COLUMN notas      |
|  +-- No queda registro de cuando ni quien lo hizo                 |
|  +-- En staging el cambio ya esta, en prod no                     |
|  +-- Diferencias de esquema silenciosas entre entornos  [!!]      |
|                                                                   |
|  CON Flyway:                                                      |
|  +-- El dev crea: V3__agregar_columna_notas.sql                   |
|  +-- Flyway ejecuta el script al arrancar en cada entorno         |
|  +-- El cambio queda registrado en flyway_schema_history          |
|  +-- Todos los entornos tienen exactamente el mismo esquema  [OK] |
|                                                                   |
|  -----------------------------------------------------------      |
|                                                                   |
|  Escenario: dos instancias arrancan simultaneamente               |
|                                                                   |
|  CON ddl-auto:update:                                             |
|  +-- Race condition: ambas ejecutan ALTER TABLE -> error  [!!]    |
|                                                                   |
|  CON Flyway:                                                      |
|  +-- Flyway usa lock en BD: solo una instancia migra  [OK]        |
|                                                                   |
+-------------------------------------------------------------------+
```

### Riesgos y Mitigacion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| La BD ya tiene datos en Release 1 y Flyway no reconoce el esquema | Alta | Alto | Usar `baseline-on-migrate: true` para marcar el estado actual como V1 |
| Modificar un script ya ejecutado causa fallo al arrancar | Media | Medio | Nunca editar archivos `Vx__` ya aplicados; crear un nuevo script `Vx+1__` |
| Conflicto de version entre dos desarrolladores | Baja | Medio | Coordinar numeracion en el equipo; usar PR reviews para los scripts |
| `show-sql: false` oculta queries usadas para debug | Baja | Bajo | Activar `show-sql: true` solo en perfil `dev` con `application-dev.yml` |

### Plan de Implementacion

```
Sprint 1:
+-- Agregar dependencias flyway-core y flyway-database-postgresql en pom.xml
+-- Cambiar ddl-auto: update -> validate en application.yml
+-- Desactivar show-sql en application.yml (mover a application-dev.yml)
+-- Crear directorio db/migration/
+-- Crear V1__crear_tabla_reservas.sql con el esquema actual
+-- Ejecutar localmente y verificar que flyway_schema_history se crea correctamente

Validacion:
+-- Confirmar arranque exitoso con ddl-auto: validate (esquema coincide con V1__)
+-- Probar con docker-compose: levantar postgres limpio + ms-reservas
+-- Verificar que show-sql no aparece en logs de produccion
```

### Consecuencias

**Positivas:**
- [OK] Historial completo y auditable de todos los cambios de esquema.
- [OK] El esquema es reproducible en cualquier entorno a partir de cero.
- [OK] Flyway protege contra race conditions con locking a nivel de BD.
- [OK] `ddl-auto: validate` detecta inconsistencias entre entidad y esquema al arrancar.
- [OK] `show-sql: false` en produccion reduce ruido en logs y mejora rendimiento.

**Negativas:**
- [!!] El equipo debe crear un archivo `Vx__` por cada cambio estructural en las entidades JPA.
- [!!] Los scripts una vez ejecutados son inmutables; los errores se corrigen con un script adicional.
- [!!] Requiere coordinacion de numeracion de versiones entre desarrolladores.

---

## Resumen Ejecutivo

### Comparativa General de ADRs

```
+--------------------------------------------------------------------+
|                    RESUMEN DE ADRS — RELEASE 2                     |
+------------+------------------+------------+-----------------------+
|    ADR     |     Impacto      |   Esfuerzo |  Riesgo si no aplica  |
+------------+------------------+------------+-----------------------+
| ADR-001    | ALTO             | BAJO       | Imposible desplegar   |
| Config.    | Bloquea deploy   | ~35 lineas | fuera de local        |
| Ext.       | en cualquier env |            |                       |
+------------+------------------+------------+-----------------------+
| ADR-002    | ALTO             | MEDIO      | HTTP semantica rota,  |
| Excepciones| Contrato HTTP    | 3 clases   | frontend fragil,      |
|            | incorrecto       | nuevas     | debug dificil         |
+------------+------------------+------------+-----------------------+
| ADR-003    | ALTO             | MEDIO      | Riesgo de perdida o   |
| Flyway     | Integridad de BD | 2 deps +   | corrupcion de esquema |
|            | en produccion    | scripts SQL| en produccion         |
+------------+------------------+------------+-----------------------+
```

### Orden de Aplicacion Recomendado

```
Release 2 — Sprint 1:
+-- ADR-001: Externalizar configuracion del Gateway
|           (bajo esfuerzo, desbloquea cualquier despliegue)
+-- ADR-002: Jerarquia de excepciones de dominio
|           (mejora inmediata del contrato HTTP con el frontend)

Release 2 — Sprint 2:
+-- ADR-003: Migrar a Flyway
            (requiere coordinacion con el estado actual de la BD en Release 1)
```

---

## Referencias

- Fowler, M. (2004). *Patterns of Enterprise Application Architecture* — Repository, Service Layer
- Richardson, C. (2018). *Microservices Patterns* — Externalized Configuration
- Nygard, M. (2007). *Release It!* — Stability Patterns
- Spring Documentation — Externalized Configuration (docs.spring.io)
- Flyway Documentation — Migration Versioning (documentation.red-gate.com)
- RFC 9110 — HTTP Semantics — Codigos de estado 4xx y 5xx

---

*Documento generado para reservas-canchas-api — Sistema de Gestion de Reservas de Canchas Deportivas*
