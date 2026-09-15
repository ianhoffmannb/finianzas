# FinIANzas

App de finanzas personales de Ian — React + Vite + TypeScript + Supabase (Postgres, Auth, Storage).

Implementa el diseño de `project/FinIANzas.dc.html` (bundle de Claude Design) como app real y funcional, con datos propios en vez del mockup estático.

## Setup

1. **Base de datos**: en el SQL editor de tu proyecto de Supabase, ejecuta en orden:
   - `supabase/schema.sql`
   - `supabase/storage.sql`
   - `supabase/migration-002.sql` (categorías de gastos variables, flujos programados,
     metas cumplidas, y borrado de todo lo anterior a septiembre 2026)
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

## Qué hace

- **Mes**: ingresos, gastos fijos, y gastos variables con tope y gasto real por categoría
  (Café, Comida, Panoramas, Transporte, Regalos, Otros).
- **Inicio**: patrimonio, flujo del mes con gráfico de distribución, vencimientos y metas.
- **Estados financieros**: vista mensual y anual, ahorro acumulado, y reporte de una página
  exportable a PDF con análisis de los números.
- **Proyecciones**: caja proyectada a 12 meses con gastos e ingresos programados (corto plazo)
  y tres escenarios a cinco años (largo plazo).
- **Metas**: crear, editar, marcar cumplida y eliminar.
- **Cierre de mes**: asistente de 4 pasos; el ahorro comprometido se suma solo al saldo de su
  cuenta destino.
- **Hogar**: contabilidad separada de la plata de la casa, con boletas adjuntas.

## Notas de diseño

- Una sola familia tipográfica (Outfit), cifras siempre `tabular-nums` alineadas a la derecha.
- Lleno = comprometido y conocido. Punteado/discontinuo = supuesto tuyo (metas que asumen sueldo futuro, escenarios conservador/optimista).
- **Hogar** es un material aparte (fondo tinta, sin azul/verde) y nunca sube a tu patrimonio, flujo o proyecciones — es contabilidad separada.
- Septiembre 2026 es el primer mes de la historia: no se navega ni se calcula nada anterior.
- Los colores de los gráficos están validados (luminosidad, croma, separación para daltonismo
  y contraste) en modo claro y oscuro; la identidad nunca queda solo en el color.
- El modal de cierre de mes es el único lugar donde se actualizan saldos de cuentas; el resto de la app lee esos saldos, no los edita directamente salvo corrección manual en Cuentas.
