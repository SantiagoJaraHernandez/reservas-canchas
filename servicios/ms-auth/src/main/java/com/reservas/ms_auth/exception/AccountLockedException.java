package com.reservas.ms_auth.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("Cuenta bloqueada temporalmente por intentos fallidos. Intente mas tarde");
    }
}
