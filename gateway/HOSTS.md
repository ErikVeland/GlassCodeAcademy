# Hosts File Configuration

To access the modules locally, add the following entries to your hosts file:

## For Linux/Mac:
Add these lines to `/etc/hosts`:

```
127.0.0.1 react.fullstackacademy.local
127.0.0.1 laravel.fullstackacademy.local
127.0.0.1 node.fullstackacademy.local
127.0.0.1 tailwind.fullstackacademy.local
127.0.0.1 sass.fullstackacademy.local
```

## For Windows:
Add these lines to `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 react.fullstackacademy.local
127.0.0.1 laravel.fullstackacademy.local
127.0.0.1 node.fullstackacademy.local
127.0.0.1 tailwind.fullstackacademy.local
127.0.0.1 sass.fullstackacademy.local
```

## After updating hosts file:

1. Flush DNS cache:
   - Linux: `sudo systemctl restart NetworkManager`
   - Mac: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`

2. Start the gateway:
   ```bash
   docker-compose up -d
   ```

3. Access the modules at:
   - React: https://react.fullstackacademy.local
   - Laravel: https://laravel.fullstackacademy.local
   - Node.js: https://node.fullstackacademy.local
   - Tailwind CSS: https://tailwind.fullstackacademy.local
   - SASS: https://sass.fullstackacademy.local