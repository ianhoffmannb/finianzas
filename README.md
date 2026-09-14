# FinIANzas

App de finanzas personales de Ian — React + Vite + TypeScript + Supabase (Postgres, Auth, Storage).

Implementa el diseño de `project/FinIANzas.dc.html` (bundle de Claude Design) como app real y funcional, con datos propios en vez del mockup estático.

## Setup

1. **Base de datos**: en el SQL editor de tu proyecto de Supabase, ejecuta en orden:
   - `supabase/schema.sql`
   - `supabase/storage.sql`
2. **Variables de entorno**: copia `.env.example` a `.env` y completa con tu URL y anon key (Project Settings → API en Supabase).
3. **Instalar y correr**:
   ```
   npm install
   npm run dev
   ```
4. Entra a la app, créate una cuenta (Supabase Auth con email/password) y empieza agregando tus cuentas, ingresos y gastos fijos desde las vistas Cuentas y Mes.

## Estructura

- `src/pages/` — las 7 vistas (Inicio, Mes, Estados, Metas, Proyecciones, Cuentas, Hogar)
- `src/components/cierre/CierreWizard.tsx` — modal de cierre de mes (4 pasos)
- `src/hooks/` — acceso a datos por dominio, todo vía Supabase con RLS por `auth.uid()`
- `src/styles/tokens.css` — paleta, tipografía y espaciado del sistema de diseño (claro + oscuro)
- `supabase/` — schema SQL y políticas de Storage

## Notas de diseño

- Una sola familia tipográfica (Outfit), cifras siempre `tabular-nums` alineadas a la derecha.
- Lleno = comprometido y conocido. Punteado/discontinuo = supuesto tuyo (metas que asumen sueldo futuro, escenarios conservador/optimista).
- **Hogar** es un material aparte (fondo tinta, sin azul/verde) y nunca sube a tu patrimonio, flujo o proyecciones — es contabilidad separada.
- El modal de cierre de mes es el único lugar donde se actualizan saldos de cuentas; el resto de la app lee esos saldos, no los edita directamente salvo corrección manual en Cuentas.
