package com.reservas.ms_auth.service;

import com.reservas.ms_auth.model.User;
import com.reservas.ms_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;

    public List<User> listar() {
        return userRepository.findAll();
    }

    public User obtener(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + id));
    }

    public User actualizarRol(String id, String rol) {
        String normalized = rol.toUpperCase();
        if (!normalized.equals("ADMIN") && !normalized.equals("USER")) {
            throw new IllegalArgumentException("Rol inválido. Use ADMIN o USER");
        }
        User user = obtener(id);
        user.setRol(normalized);
        return userRepository.save(user);
    }
}
