# Despliegue en AWS — datos de acceso

| Dato | Valor |
|---|---|
| URL de la aplicación | https://54-224-173-10.sslip.io |
| Cuenta AWS (ID) | 449406670394 |
| Región | us-east-1 (Norte de Virginia) |
| Instancia | `i-000e8e7547c3ca69d` — t3.small, Ubuntu LTS, disco gp3 de 20 GB cifrado |
| Inicio de sesión del docente | https://449406670394.signin.aws.amazon.com/console |
| Usuario IAM del docente | `docente-seguridad` (la contraseña inicial se entrega por aparte y AWS obliga a cambiarla en el primer ingreso) |

## Qué puede hacer el docente con su usuario IAM

Políticas adjuntas (mínimo privilegio):

- **`SecurityAudit`** (administrada por AWS): lectura de la configuración de seguridad de toda la cuenta (IAM, EC2, Security Groups, CloudTrail, etc.).
- **`DocenteAuditoriaReservasCanchas`** (propia, ver `iam-politica-docente.json`): `ec2:Describe*`, consulta de Systems Manager y **`ssm:StartSession` solo sobre la instancia del proyecto**.
- `IAMUserChangePassword`: para cambiar su contraseña.

No puede crear, modificar ni borrar recursos.

## Conexión remota a la instancia (sin SSH ni llaves)

1. Ingresar a la consola con el usuario `docente-seguridad`.
2. EC2 → Instancias → `reservas-canchas` → **Conectar** → pestaña **Session Manager** → Conectar.
3. Dentro de la terminal:
   ```bash
   sudo -i
   cd /opt/reservas
   docker compose ps                 # estado de los contenedores
   docker compose logs --tail 50 gateway
   cat /var/log/reservas-bootstrap.log
   ```
Todas las sesiones quedan registradas en CloudTrail.

## Controles de la capa de nube

- Security Group con **solo 80 y 443** de entrada. El puerto 22 está cerrado.
- **IMDSv2 obligatorio** con límite de saltos 1: los contenedores no pueden robar credenciales del rol de la instancia.
- Rol de instancia `reservas-ec2-ssm` con únicamente `AmazonSSMManagedInstanceCore`.
- Volumen EBS cifrado.
- `user-data.sh` aplica swap, parches automáticos, hardening de SSH y kernel, `ufw`, `fail2ban` y Docker endurecido.

## Recrear el despliegue desde cero

Opción consola: lanzar una instancia Ubuntu t3.small con el rol `reservas-ec2-ssm`, Security Group 80/443, IMDSv2
y en *Datos de usuario*:
```bash
#!/bin/bash
curl -fsSL https://raw.githubusercontent.com/SantiagoJaraHernandez/reservas-canchas/hardening-seguridad/deploy/aws/user-data.sh -o /root/user-data.sh && bash /root/user-data.sh
```
Opción CLI (CloudShell): `curl -fsSL https://raw.githubusercontent.com/SantiagoJaraHernandez/reservas-canchas/hardening-seguridad/deploy/aws/crear-infra.sh | bash`

La contraseña del administrador de la aplicación queda en la instancia en `/root/credenciales-admin.txt`.

## Costo

La cuenta está en el **Free plan** de AWS (cuenta nueva): el uso se descuenta de los créditos
gratuitos y AWS no cobra en ese plan. Al terminar la evaluación: EC2 → Terminar instancia.
