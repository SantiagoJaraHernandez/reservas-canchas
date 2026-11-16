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

    @ExceptionHandler(ReservaNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ReservaNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(errorBody(ex.getMessage()));
    }

    @ExceptionHandler(CanchaNotFoundException.class)
    public ResponseEntity<?> handleCanchaNotFound(CanchaNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(errorBody(ex.getMessage()));
    }

    @ExceptionHandler(CanchaOcupadaException.class)
    public ResponseEntity<?> handleConflict(CanchaOcupadaException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(errorBody(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String campos = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorBody("Validacion fallida: " + campos));
    }


    // HARDENING: errores de cliente -> 400 sin exponer detalles internos
    @ExceptionHandler({IllegalArgumentException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<?> handleBadRequest(Exception ex) {
        String msg = ex instanceof IllegalArgumentException ? ex.getMessage() : "Peticion mal formada";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class).error("Error no controlado", ex);
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