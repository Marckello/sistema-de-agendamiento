-- Crear tenant Serrano Marketing
INSERT INTO tenants (id, name, slug, email, phone, "isActive", "createdAt", "updatedAt", "planId")
VALUES (
    gen_random_uuid(), 
    'Serrano Marketing', 
    'serrano', 
    'info@serrano.marketing', 
    '', 
    true, 
    NOW(), 
    NOW(), 
    '7db0d025-6283-408c-8c0d-a25704ebe356'
)
ON CONFLICT (slug) DO NOTHING;

-- Crear usuario admin Marco
INSERT INTO users (id, "tenantId", email, password, "firstName", "lastName", role, "canModify", "canDelete", "canUseAI", "isActive", "createdAt", "updatedAt", color)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE slug = 'serrano'),
    'marco@serrano.marketing',
    '$2a$10$8K1p/a0dR1xQEPCe4LLIQe5J3B3gZ1LQi7rQu3rFsF3O5q7qMmHdG',
    'Marco',
    'Serrano',
    'SUPER_ADMIN',
    true,
    true,
    true,
    true,
    NOW(),
    NOW(),
    '#3B82F6'
)
ON CONFLICT ("tenantId", email) DO NOTHING;
