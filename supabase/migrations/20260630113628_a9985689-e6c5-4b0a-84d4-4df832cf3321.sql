ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE numeric USING stock_quantity::numeric;

-- Ensure the column still has a sensible default
ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 0;