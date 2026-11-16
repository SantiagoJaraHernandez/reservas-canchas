# ---------- Etapa 1: compilacion ----------
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---------- Etapa 2: ejecucion (imagen minima, sin JDK ni Maven) ----------
FROM eclipse-temurin:17-jre-alpine
# HARDENING: usuario sin privilegios
RUN addgroup -S app && adduser -S -G app -H -s /sbin/nologin app
WORKDIR /app
COPY --from=build --chown=root:root /app/target/*.jar /app/app.jar
USER app
# Memoria acotada para servidores pequenos (free tier)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1 -Djava.io.tmpdir=/tmp"
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8082/actuator/health | grep -q UP || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
