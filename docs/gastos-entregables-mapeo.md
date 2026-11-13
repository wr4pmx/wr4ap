# WR4P — Mapeo del módulo Gastos y Entregables (2026-11-12)

## Estado verificado
Supabase `wr4p-production` ya tiene `public.projects`, `public.locations`, `public.location_team_members` y `public.location_tasks`. Todas tienen RLS habilitado. No se detectaron tablas de gastos. Este documento es diseño, **no una migración aplicada**.

## Relaciones existentes
- `projects.id`: ámbito obligatorio de cada registro económico y expediente.
- `locations.id`: vínculo opcional para pagos de locación, permisos, contratos y gastos asociados a una propiedad. Validar siempre que `locations.project_id = expense.project_id`.
- `location_team_members.id`: responsable y autor operativo, validando que pertenecen al mismo proyecto.
- `location_team_members.role`: `gerencia`, `coordinacion`, `scouter`.
- **Brecha de identidad:** `location_team_members` no tiene `auth_user_id`; nombres y correos no son una identidad autenticada. Agregar vinculación a `auth.users.id` mediante flujo de invitación antes de habilitar RLS multiusuario. No inferir identidad por nombre.
- `location_tasks`: tareas de locación; no usar como ledger de gastos. Vinculación futura opcional.

## Entidades propuestas
1. `expense_records`: `id uuid PK`, `project_id uuid FK`, `location_id uuid nullable FK`, `created_by_user_id uuid FK auth.users`, `recorded_by_member_id uuid nullable FK`, `assigned_member_id uuid nullable FK`, `concept text`, `vendor text`, `category text`, `amount numeric(14,2)`, `currency text`, `payment_method text`, `external_reference text nullable`, `status text`, `created_at`, `updated_at`. `id` es estable; no confundir con folio externo ni orden de exportación.
2. `expense_documents`: `id`, `expense_id FK`, `project_id FK`, `kind` (ticket, cfdi_xml, cfdi_pdf, recibo_nd, contrato, permiso, otro), `storage_path`, `original_filename`, `uploaded_by_user_id`, `uploaded_at`, `review_status`. Bucket privado, rutas por proyecto y gasto, descargas mediante autorización; no usar enlaces públicos.
3. `expense_events`: historial inmutable con `expense_id`, `actor_user_id`, `event_type`, `from_value`, `to_value`, `created_at`. Registrar reasignaciones, revisión y correcciones desde operaciones autorizadas.
4. `fund_allocations`: `project_id`, `member_id`, `period_start/end`, `amount`, `fund_type` (petty_cash, tarjeta_gasolina, tarjeta_empresa, deposito), `status`. Una dispersión NO equivale a gasto.
5. `delivery_templates`: `project_id`, `name`, `mapping jsonb`, `required_document_types jsonb`, `version`.
6. `delivery_packages`: `project_id`, `template_id`, `status`, `created_by_user_id`, `created_at`; `delivery_items`: `package_id`, `expense_id`, `sort_order`, `external_reference_snapshot`, `folder_name_snapshot`. Orden único por paquete, no por gasto.

## Reglas de negocio
- Registro de gasto y comprobación son estados distintos; recibir XML/PDF no equivale a aprobación fiscal.
- Scouter registra y puede adjuntar documentos a sus registros asignados; Coordinación puede reasignar, revisar y aprobar; Gerencia supervisa. Validar acceso por membresía de proyecto vinculada a `auth.uid()`, no por texto de rol enviado por cliente.
- No duplicar gastos al reasignar. Conservar historial.
- Folio externo es opcional y nunca se sobrescribe con número de carpeta.
- Una entrega genera su propia secuencia `001`, `002`, etc., sin modificar IDs ni folios. La misma operación puede estar en más de un entregable.
- CFDI XML, PDF y recibo no deducible son tipos distintos. La validación SAT es etapa posterior.
- Documentos de locación pueden existir sin gasto; diseñar un expediente documental separado o asociación polimórfica segura antes de integrarlos.
- Proteger archivos, RFC y datos bancarios con RLS y bucket privado; no insertar datos reales en prototipos públicos.

## Orden de implementación
1. Verificar políticas RLS actuales y autenticación real; enlazar miembros del equipo a usuarios.
2. Crear migración con `expense_records`, `expense_documents`, `expense_events` y políticas por proyecto; ejecutar pruebas de acceso entre proyectos.
3. Configurar Storage privado y verificar carga/descarga desde dos usuarios reales.
4. Integrar pantallas al frontend existente; no desplegar prototipos HTML independientes como aplicación principal.
5. Añadir fondos y conciliación; después plantillas y exportación de entregables con documentos.
6. Probar extremo a extremo: scouter registra → Coordinación reasigna → factura → revisión → entrega.

## Casos de referencia
Comercial Amazon: categorías y comprobación financiera; comercial Tecate: deducibles/no deducibles, contratos y permisos; serie El Repatriado: solicitudes y carpetas numeradas con consecutivo interno. Las reglas concretas de plantilla deben validarse contra los documentos editables.
