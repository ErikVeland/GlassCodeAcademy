# SSL Certificates

This directory contains SSL certificates for the gateway. For development, you can generate self-signed certificates using the following command:

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=fullstackacademy.local"
```

For production, replace these with valid SSL certificates from a certificate authority.