# 🌸 Fiuri Wedding Moments

App web per la raccolta di foto e video da parte degli ospiti durante eventi matrimoniali. Gli invitati scansionano un QR code, accedono senza login e caricano i loro momenti direttamente sul telefono.

---

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (Postgres + Storage)
- **Vercel** (deploy)

---

## Setup locale

### 1. Prerequisiti

- Node.js 18+
- Account Supabase (gratuito su supabase.com)
- Account Vercel (per il deploy)

### 2. Clona e installa

```bash
git clone <repo>
cd fiuri-wedding-moments
npm install
```

### 3. Variabili d'ambiente

Copia `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
ADMIN_PASSWORD=una-password-sicura-lunga
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE_MB=500
```

> **ATTENZIONE**: `SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_PASSWORD` non devono mai essere esposti lato client. Sono usati solo nelle API route server-side.

---

## Setup Supabase

### 1. Crea un progetto su supabase.com

Vai su [supabase.com](https://supabase.com) → New Project.

### 2. Copia le chiavi

- **Project Settings → API**
  - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Esegui la migrazione SQL

Vai su **SQL Editor** nel dashboard Supabase e incolla il contenuto di `supabase/migration.sql`. Poi esegui.

Questo crea:
- Tabella `events`
- Tabella `media_uploads`
- Indici
- RLS abilitato (accesso solo tramite service_role)

### 4. Crea il bucket Storage

1. Vai su **Storage** nel dashboard Supabase
2. Clicca **New bucket**
3. Nome: `wedding-media`
4. **NON** spuntare "Public bucket" — deve rimanere privato
5. Clicca **Create bucket**

### 5. Configura le policy Storage

Il bucket è privato. Le API usano la `service_role` key che bypassa le policy. Non servono policy pubbliche.

Se vuoi aggiungere una policy di sicurezza extra, vai su **Storage → Policies** e aggiungi:

```sql
-- Solo service_role può fare operazioni (già garantito dalla key)
-- Nessuna policy necessaria per anon/authenticated
```

---

## Avvio locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) — viene reindirizzato a `/admin/login`.

---

## Deploy su Vercel

### 1. Importa il progetto

Vai su [vercel.com/new](https://vercel.com/new) e importa il repository GitHub.

### 2. Aggiungi le variabili d'ambiente

In **Settings → Environment Variables** aggiungi tutte le variabili da `.env.example` con i valori reali.

Per `NEXT_PUBLIC_APP_URL` usa l'URL definitivo del tuo sito (es. `https://fiuri-wedding-moments.vercel.app`).

### 3. Deploy

Vercel rileva automaticamente Next.js. Clicca **Deploy**.

---

## Creare il primo evento

### Via interfaccia admin

1. Vai su `/admin/login`
2. Inserisci la password (`ADMIN_PASSWORD`)
3. Clicca **Nuovo evento**
4. Compila:
   - **Nome**: es. `Matrimonio Marco & Giulia`
   - **Slug**: viene generato automaticamente (`marco-giulia-2025`) oppure personalizzalo
   - **Codice accesso**: scegli una parola facile da ricordare (es. `fiori2025`)
5. Clicca **Crea**

### Via SQL (alternativa rapida)

```sql
INSERT INTO events (slug, title, access_code)
VALUES ('marco-giulia-2025', 'Matrimonio Marco & Giulia', 'fiori2025');
```

### Link QR per gli ospiti

Dopo aver creato l'evento, il link è:

```
https://tuosito.vercel.app/e/marco-giulia-2025?code=fiori2025
```

### Poster stampabile

Vai su **Admin → Evento → Poster** per generare un poster A5 con il QR code già incluso, pronto per la stampa.

---

## Struttura route

| Route | Descrizione |
|---|---|
| `/e/[eventSlug]?code=[code]` | Pagina upload ospiti |
| `/admin/login` | Login admin |
| `/admin` | Dashboard eventi |
| `/admin/events/[slug]` | Galleria upload evento |
| `/admin/events/[slug]/poster` | Poster QR stampabile |

### API Route

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/events/verify` | POST | Verifica slug + codice |
| `/api/upload` | POST | Upload singolo file |
| `/api/admin/login` | POST | Login admin |
| `/api/admin/logout` | POST | Logout admin |
| `/api/admin/events` | GET/POST | Lista / crea eventi |
| `/api/admin/events/[slug]` | GET/PATCH | Dettaglio / modifica evento |
| `/api/admin/media` | GET | Lista upload con filtri |
| `/api/admin/signed-url` | POST | Genera URL download |
| `/api/admin/export-csv` | GET | Esporta CSV upload |

---

## Checklist pre-evento

- [ ] Supabase: migrazione SQL eseguita
- [ ] Supabase: bucket `wedding-media` creato (privato)
- [ ] `.env.local` / Vercel env compilate
- [ ] App deployata e accessibile
- [ ] `NEXT_PUBLIC_APP_URL` punta all'URL pubblico corretto
- [ ] Evento creato con slug e codice accesso
- [ ] Link testato da smartphone: `/e/[slug]?code=[code]`
- [ ] Upload di un file di test andato a buon fine
- [ ] Poster QR stampato e appeso in location
- [ ] Admin: verifica ricezione file di test

---

## Limiti file

- Max **20 file** per sessione di upload
- Max **500 MB** per file (configurabile via `MAX_FILE_SIZE_MB`)
- Formati accettati: JPG, PNG, GIF, WEBP, HEIC/HEIF, MP4, MOV, MPEG, WEBM, 3GP, AVI

---

## Sicurezza

- `SUPABASE_SERVICE_ROLE_KEY` usata solo server-side (API routes)
- `ADMIN_PASSWORD` mai esposta al client
- Cookie admin: `httpOnly`, `secure` (in produzione), `sameSite: lax`
- RLS abilitato su tutte le tabelle — accesso solo via service_role
- Bucket Storage privato — download solo tramite signed URL admin
- Validazione slug, codice, MIME type, dimensione file, nome ospite
- Sanitizzazione path storage (no path traversal)

---

## Sviluppo locale con Supabase CLI (opzionale)

```bash
npm install -g supabase
supabase login
supabase init
supabase start
# Poi esegui migration.sql nel database locale
```
