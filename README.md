# Sistema de Reservas de Canchas — versión endurecida (hardening)

Proyecto final de **Seguridad de la Información** (CORHUILA, Ingeniería de Sistemas).
Toma el sistema distribuido de reservas desarrollado en Sistemas Distribuidos y lo
endurece a nivel de código, contenedores, red, sistema operativo y nube.

> Los repositorios originales (`reservas-canchas-gateway`, `-ms-auth`, `-ms-reservas`,
> `-portal`, `-infra`) se conservan sin cambios. Esta rama los integra en un único
> repositorio para que el ambiente se levante con un solo comando.
> El detalle de cada cambio está en **[HARDENING.md](HARDENING.md)**.

## Arquitectura

```
Internet ──443/80──► Caddy (TLS, cabeceras, límite de cuerpo)
                       ├── /      ► frontend (nginx sin privilegios, React)
                       └── /api/* ► gateway (JWT, rate limit, validación)
                                      │  red "backend" (interna)
                                      ├── ms-auth ──────► MongoDB  (auth activada)
                                      └── ms-reservas ──► PostgreSQL (SCRAM)
                                                 red "data" (interna)
```

Solo Caddy publica puertos. Gateway, microservicios y bases de datos no son
alcanzables desde fuera, y las redes `backend` y `data` no tienen salida a internet.

## Estructura

| Carpeta | Contenido |
|---|---|
| `servicios/gateway` | API Gateway (Spring WebFlux, JWT, rate limiting) |
| `servicios/ms-auth` | Autenticación y usuarios (Spring Boot + MongoDB) |
| `servicios/ms-reservas` | Canchas y reservas (Spring Boot + PostgreSQL) |
| `frontend` | Portal React + Vite servido por nginx |
| `deploy/caddy` | Proxy de borde con HTTPS automático |
| `deploy/mongo-init` | Usuario de aplicación de Mongo con privilegio mínimo |
| `deploy/aws` | Script de aprovisionamiento EC2 y política IAM del docente |
| `docker-compose.yml` | Orquestación completa endurecida |
| `docs/` | ADR y planeación del proyecto original |

## Levantar en local

Requisitos: Docker 24+ con Docker Compose v2 (Linux, macOS o Windows con WSL2/Git Bash) y unos 4 GB de RAM libres.

```bash
git clone -b hardening-seguridad https://github.com/SantiagoJaraHernandez/reservas-canchas.git
cd reservas-canchas
./deploy/generate-env.sh          # crea .env con secretos aleatorios e imprime la clave del admin
docker compose up -d --build      # la primera vez tarda varios minutos (compila Maven)
docker compose ps                 # todos deben quedar "healthy"
```

Abrir <http://localhost>. Para entrar como administrador use el correo y la contraseña
que imprimió `generate-env.sh` (también están en `.env`, variables `ADMIN_EMAIL` /
`ADMIN_PASSWORD`). Un usuario normal se puede registrar desde la pantalla de registro.

Apagar: `docker compose down` (agregar `-v` para borrar también los datos).

## Despliegue en la nube (AWS)

La versión pública corre en una instancia **EC2 (Ubuntu 24.04)** del *Free plan* de AWS.
`deploy/aws/user-data.sh` aprovisiona todo al crear la instancia: swap, parches
automáticos, hardening de SSH, kernel y firewall, Docker endurecido, secretos y HTTPS
con un dominio `IP.sslip.io`. Pasos y datos de acceso: **[deploy/aws/README.md](deploy/aws/README.md)**.

## Pruebas rápidas de los controles

```bash
H=https://<dominio>          # o http://localhost
# 1. Crear admin sin autenticación -> 401 (antes 201)
curl -i -X POST $H/api/auth/register-admin -H 'Content-Type: application/json' \
     -d '{"nombre":"x","email":"x@x.co","password":"Abcdef1!"}'
# 2. Suplantar rol con cabecera -> 401 (la cabecera se elimina en el gateway)
curl -i $H/api/usuarios -H 'X-User-Role: ADMIN'
# 3. Contraseña débil -> 400
curl -i -X POST $H/api/auth/register -H 'Content-Type: application/json' \
     -d '{"nombre":"Ana","email":"ana@x.co","password":"123456"}'
# 4. Fuerza bruta -> 429 tras 10 intentos/minuto por IP o 5 fallos por cuenta
for i in $(seq 1 12); do curl -s -o /dev/null -w '%{http_code} ' -X POST $H/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"ana@x.co","password":"Mala123!"}'; done
# 5. Actuator no expuesto
curl -i $H/api/actuator/env
```
