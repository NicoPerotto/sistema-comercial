-- Add isDefault flag to PaymentMethod (solo un método puede ser default, se controla en app).
-- IF NOT EXISTS para que sea seguro re-ejecutar (ej. si ya se aplicó manual desde el editor SQL de Supabase).
ALTER TABLE "PaymentMethod" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
