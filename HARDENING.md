# Informe de hardening — Sistema de Reservas de Canchas

## 1. Hallazgos en la versión original

Revisión manual del código de `gateway`, `ms-auth`, `ms-reservas`, `portal` e `infra`
(rama `main`), con referencia al OWASP Top 10 2021 y al OWASP API Security Top 10 2023.

| # | Hallazgo | Severidad | OWASP |
|---|---|---|---|
| H1 | `POST /auth/register-admin` público: cualquiera podía crearse una cuenta ADMIN | Crítica | A01 Broken Access Control / API5 |
| H2 | Microservicios confían en cabeceras `X-User-Role` / `X-User-Id` sin verificar el origen; con los puertos expuestos se podía enviar `X-User-Role: ADMIN` directamente | Crítica | A01 / API1 |
| H3 | Secretos quemados en código y compose (`JWT_SECRET` por defecto, `reservas123` de Postgres) | Alta | A02 / A05 |
| H4 | MongoDB sin autenticación y publicado en el puerto 27020 | Alta | A05 |
| H5 | Postgres, Mongo, gateway y microservicios publicados en puertos del host | Alta | A05 |
| H6 | Sin límite de intentos de login ni rate limiting | Alta | A07 / API4 |
| H7 | `/actuator/**` público en el gateway (coincidencia `startsWith`) | Media | A05 |
| H8 | Token JWT de 24 h, sin emisor ni `jti` | Media | A07 |
| H9 | Política de contraseña débil en backend (6 caracteres) | Media | A07 |
| H10 | Contenedores corriendo como root, sin límites de memoria ni healthchecks | Media | A05 |
| H11 | Sin cabeceras de seguridad (CSP, X-Frame-Options, HSTS), versión de nginx expuesta | Media | A05 |
| H12 | CORS quemado en `@CrossOrigin` y `allowedHeaders("*")` | Baja | A05 |
| H13 | Dependencias vulnerables (axios < 1.21 con CVE altos, Spring Boot 3.3.5) | Alta | A06 |
| H14 | `GET /reservas` traía todas las reservas a memoria y filtraba en Java; sin validar `horaInicio < horaFin` ni longitudes | Baja | API4 / A04 |
| H15 | Sin HTTPS | Alta | A02 |

## 2. Cambios aplicados

### 2.1 Código (aplicación)

| Control | Dónde | Corrige |
|---|---|---|
| `register-admin` exige JWT y rol ADMIN; el primer admin se crea al arrancar desde variables de entorno | `ms-auth` `AuthController`, `AdminBootstrap` | H1 |
| El gateway borra siempre `X-User-*` y `X-Internal-Token` que envíe el cliente y los vuelve a poner desde el JWT validado | `gateway` `JwtAuthFilter` | H2 |
| Token interno compartido gateway → microservicios, comparado en tiempo constante (zero-trust interno) | `InternalTokenFilter` en `ms-auth` y `ms-reservas` | H2 |
| Rutas públicas por coincidencia exacta (método + ruta) | `JwtAuthFilter` | H7 |
| Rate limiting por IP: 10/min en login y registro, 120/min en el resto | `gateway` `RateLimitFilter` | H6 |
| Bloqueo de cuenta 15 min tras 5 fallos; BCrypt costo 12; tiempo constante ante usuario inexistente | `LoginAttemptService`, `AuthService`, `SecurityConfig` | H6, H9 |
| JWT de 1 h con `iss` y `jti`; secreto obligatorio de ≥ 32 bytes (si falta, el servicio no arranca) | `JwtService`, `JwtTokenProvider` | H3, H8 |
| Contraseña 8–72 caracteres con mayúscula, minúscula, número y símbolo; longitudes máximas en todos los campos | DTOs | H9, H14 |
| Validación de IDs por lista blanca antes de armar URLs internas (evita path traversal hacia servicios internos) | `GatewayController` | — |
| Timeouts y límite de tamaño en las llamadas internas; cuerpo máximo de 256 KB | `WebClientConfig`, `application.yml` | DoS |
| Errores sin stacktrace ni mensajes internos; actuator solo `/health` sin detalles | `application.yml`, `GlobalExceptionHandler` | H7 |
| Cabeceras de seguridad en la API | `SecurityHeadersFilter` | H11 |
| CORS solo desde variable, sin comodines, cabeceras explícitas | `WebFluxConfiguration` | H12 |
| Consulta de reservas por usuario en BD; validación de horario y rango de fecha | `ReservaRepository`, `ReservaController` | H14 |
| Logs de auditoría de login y de creación de administradores (sin contraseñas ni tokens) | `AuthService`, `AuthController` | A09 |
| Spring Boot 3.5.11 en los tres servicios; axios 1.21.x; `npm audit` en 0; se quitó `devtools` | `pom.xml`, `package.json` | H13 |

### 2.2 Contenedores y red

- **Una sola entrada:** Caddy publica 80/443. Gateway, servicios y bases de datos no tienen puertos publicados.
- **Segmentación:** red `edge` (Caddy, frontend, gateway), red `backend` interna y red `data` interna. Las bases de datos solo se ven desde su microservicio.
- **HTTPS automático** con Let's Encrypt, HSTS y bloqueo de `/api/actuator` en el borde.
- **Secretos** generados con `openssl rand` en `.env` con permisos 600, excluido de git. Docker Compose se niega a arrancar si falta alguno.
- **MongoDB** con autenticación (`--auth`) y usuario de aplicación con solo `readWrite` sobre `authdb`. **PostgreSQL** con SCRAM-SHA-256.
- **Contenedores:** usuario sin privilegios (Java y nginx), `read_only`, `cap_drop: ALL`, `no-new-privileges`, límites de memoria, healthchecks, rotación de logs e imágenes con versión fija.
- **Imágenes mínimas:** multi-stage build. El runtime es JRE Alpine, sin Maven ni JDK.
- **nginx:** `server_tokens off`, CSP, bloqueo de archivos ocultos, solo GET/HEAD.

### 2.3 Servidor y nube (AWS EC2)

- Instancia Ubuntu LTS (t3.small) en el Free plan, volumen EBS cifrado, IMDSv2 obligatorio con límite de saltos 1.
- Security Group con solo 80 y 443 abiertos. SSH cerrado: la administración se hace por **AWS Systems Manager Session Manager**, con IAM y auditoría en CloudTrail.
- SSH sin contraseñas ni root, `fail2ban`, `ufw`, parámetros de kernel endurecidos y `unattended-upgrades`.
- Docker con `no-new-privileges`, `live-restore` y logs rotados.
- **Acceso del docente:** usuario IAM `docente-seguridad` con `SecurityAudit` (solo lectura) y una política propia que permite `ssm:StartSession` únicamente sobre la instancia del proyecto (mínimo privilegio, sin llaves SSH compartidas).

### 2.4 Proceso (DevSecOps)

GitHub Actions compila los tres servicios y el frontend, ejecuta `npm audit` (falla si hay
vulnerabilidades altas), valida el compose y busca secretos filtrados con gitleaks.

## 3. Riesgos residuales y trabajo futuro

- El rate limiting y el bloqueo de cuentas viven en memoria: se pierden al reiniciar y no escalan a varias réplicas. En producción conviene Redis.
- El JWT se guarda en `localStorage`. La CSP estricta reduce el riesgo de XSS, pero una cookie `HttpOnly` + `SameSite=Strict` sería más segura.
- No hay revocación de tokens (logout del lado del servidor). Se mitiga con la expiración de 1 hora.
- El esquema de Postgres se gestiona con `ddl-auto=update`. Lo ideal es Liquibase con `validate`.
- Los backups no están automatizados. Siguiente paso: snapshots de EBS con AWS Backup.
- `POST /auth/register` responde 409 si el correo existe (permite enumerar usuarios). Se aceptó por usabilidad y queda limitado por el rate limiting.
