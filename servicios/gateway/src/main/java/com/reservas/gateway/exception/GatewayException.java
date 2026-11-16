package com.reservas.gateway.exception;

public class GatewayException extends RuntimeException {

    private final int status;
    private final String body;

    public GatewayException(int status, String body) {
        super(body);
        this.status = status;
        this.body = body;
    }

    public int getStatus() { return status; }
    public String getBody() { return body; }
}