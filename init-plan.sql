INSERT INTO plans (
  id, name, "displayName", description, price, currency, interval, 
  "maxEmployees", "maxClients", "maxAppointments", "maxServices",
  "hasPublicBooking", "hasEmailReminders", "hasSmsReminders", "hasWebhooks", 
  "hasReports", "hasCustomBranding", "isActive", "createdAt", "updatedAt"
) VALUES (
  'plan-free', 'free', 'Plan Gratuito', 'Plan inicial gratuito', 0, 'USD', 'monthly',
  2, 50, 100, 5,
  true, true, false, false,
  false, false, true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
