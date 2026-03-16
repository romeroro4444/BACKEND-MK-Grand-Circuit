# MK Grand Circuit Backend - Setup Local y Deploy en Vercel

## 1) Requisitos

- Node.js 18+
- Cuenta y proyecto en Supabase
- Bucket en Supabase Storage llamado `team-assets` (public)

## 2) Instalacion local

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo `.env` en la raiz del proyecto con estas variables:

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET=UN_SECRETO_LARGO_Y_SEGURO
ADMIN_SETUP_KEY=CLAVE_SECRETA_PARA_REGISTER_ADMIN
SUPABASE_STORAGE_BUCKET_TEAMS=team-assets
PORT=3000
```

## 3) Crear base de datos (SQL)

Ejecuta estos archivos en Supabase SQL Editor, en este orden:

1. `src/config/users.sql`
2. `src/config/teams.sql`
3. `src/config/tournaments.sql`
4. `src/config/registrations.sql`
5. `src/config/rounds.sql`
6. `src/config/matches.sql`

## 4) Ejecutar en local

Desarrollo:

```bash
npm run dev
```

Produccion local:

```bash
npm start
```

Swagger:

- `http://localhost:3000/api-docs`

## 5) Flujo de imagenes (logo/banner)

1. Crea equipo (`POST /teams`).
2. Genera URL firmada (`POST /teams/{id}/upload-url`) con `type=logo` o `type=banner`.
3. Sube el archivo binario al `signedUrl` retornado.
4. Guarda la URL publica en el equipo usando `PATCH /teams/{id}` con `logoUrl` o `bannerUrl`.

## 6) Deploy en Vercel

Este repo ya incluye:

- `api/index.js` como entrada serverless para Express.
- `vercel.json` con rutas de despliegue.

Pasos:

1. Sube el repo a GitHub.
2. En Vercel, crea un proyecto importando ese repo.
3. Configura Variables de Entorno en Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `ADMIN_SETUP_KEY`
   - `SUPABASE_STORAGE_BUCKET_TEAMS`
4. Deploy.

## 7) Notas importantes

- No expongas `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- Usa siempre `ADMIN_SETUP_KEY` para crear admins por `/auth/register-admin`.
- Si cambias el nombre del bucket, actualiza `SUPABASE_STORAGE_BUCKET_TEAMS`.
