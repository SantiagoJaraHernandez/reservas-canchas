package com.reservas.ms_auth.service;

import com.reservas.ms_auth.config.JwtService;
import com.reservas.ms_auth.dto.LoginRequest;
import com.reservas.ms_auth.dto.LoginResponse;
import com.reservas.ms_auth.dto.RegisterRequest;
import com.reservas.ms_auth.dto.RegisterResponse;
import com.reservas.ms_auth.exception.AccountLockedException;
import com.reservas.ms_auth.exception.EmailAlreadyExistsException;
import com.reservas.ms_auth.exception.InvalidCredentialsException;
import com.reservas.ms_auth.model.User;
import com.reservas.ms_auth.repository.UserRepository;
import com.reservas.ms_auth.security.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

/**
 * HARDENING:
 *  - Emails normalizados (minusculas) para evitar cuentas duplicadas por mayusculas.
 *  - Bloqueo de cuenta tras intentos fallidos (LoginAttemptService).
 *  - Mitigacion de enumeracion de usuarios por tiempo de respuesta: si el
 *    usuario no existe igual se ejecuta un BCrypt contra un hash ficticio.
 *  - Logs de auditoria de login exitoso/fallido sin registrar contrasenas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;

    private String dummyHash;

    public RegisterResponse register(RegisterRequest request) {
        return createUser(request, "USER");
    }

    public RegisterResponse registerAdmin(RegisterRequest request) {
        return createUser(request, "ADMIN");
    }

    public User createUserIfMissing(String nombre, String email, String rawPassword, String rol) {
        String normalized = normalize(email);
        Optional<User> existing = userRepository.findByEmail(normalized);
        if (existing.isPresent()) {
            return existing.get();
        }
        User user = new User();
        user.setNombre(nombre);
        user.setEmail(normalized);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRol(rol);
        user.setFechaCreacion(LocalDateTime.now());
        return userRepository.save(user);
    }

    private RegisterResponse createUser(RegisterRequest request, String rol) {
        String email = normalize(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = new User();
        user.setNombre(request.getNombre().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRol(rol);
        user.setFechaCreacion(LocalDateTime.now());

        User saved = userRepository.save(user);
        log.info("AUDIT usuario registrado id={} rol={}", saved.getId(), rol);
        return new RegisterResponse(saved.getId(), saved.getEmail(), saved.getRol());
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalize(request.getEmail());

        if (loginAttemptService.isBlocked(email)) {
            log.warn("AUDIT login bloqueado (cuenta en bloqueo temporal)");
            throw new AccountLockedException();
        }

        Optional<User> found = userRepository.findByEmail(email);
        if (found.isEmpty()) {
            passwordEncoder.matches(request.getPassword(), dummyHash());
            loginAttemptService.loginFailed(email);
            log.warn("AUDIT login fallido");
            throw new InvalidCredentialsException();
        }

        User user = found.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginAttemptService.loginFailed(email);
            log.warn("AUDIT login fallido userId={}", user.getId());
            throw new InvalidCredentialsException();
        }

        loginAttemptService.loginSucceeded(email);
        log.info("AUDIT login exitoso userId={}", user.getId());
        String token = jwtService.generateToken(user.getEmail(), user.getRol(), user.getId());
        return new LoginResponse(token, "Bearer", jwtService.getExpiration(), user.getEmail(), user.getRol());
    }

    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode("dummy-password-para-tiempo-constante");
        }
        return dummyHash;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
