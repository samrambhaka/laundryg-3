
-- Admin credentials table (email/password based admins)
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  mobile_number text NOT NULL,
  panchayath_id uuid REFERENCES public.panchayaths(id),
  ward_id uuid REFERENCES public.wards(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin credentials"
  ON public.admin_credentials FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Super admins can insert admin credentials"
  ON public.admin_credentials FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update admin credentials"
  ON public.admin_credentials FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Super admins can delete admin credentials"
  ON public.admin_credentials FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_admin_credentials_updated_at
  BEFORE UPDATE ON public.admin_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Laundry features table (e.g., pants wash, pants ironing)
CREATE TABLE IF NOT EXISTS public.laundry_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'clothing',
  price_wash numeric(10,2),
  price_iron numeric(10,2),
  price_wash_iron numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.laundry_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active laundry features"
  ON public.laundry_features FOR SELECT USING (true);

CREATE POLICY "Admins can insert laundry features"
  ON public.laundry_features FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update laundry features"
  ON public.laundry_features FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete laundry features"
  ON public.laundry_features FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_laundry_features_updated_at
  BEFORE UPDATE ON public.laundry_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add-on services table (cleaning, electrical, plumber, etc.)
CREATE TABLE IF NOT EXISTS public.addon_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'home',
  booking_charge numeric(10,2) NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  icon_name text DEFAULT 'wrench',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.addon_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active addon services"
  ON public.addon_services FOR SELECT USING (true);

CREATE POLICY "Admins can insert addon services"
  ON public.addon_services FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update addon services"
  ON public.addon_services FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete addon services"
  ON public.addon_services FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_addon_services_updated_at
  BEFORE UPDATE ON public.addon_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service bookings table
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  addon_service_id uuid NOT NULL REFERENCES public.addon_services(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  booking_charge numeric(10,2) NOT NULL,
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.service_bookings FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own bookings"
  ON public.service_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update bookings"
  ON public.service_bookings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default laundry features
INSERT INTO public.laundry_features (name, category, price_wash, price_iron, price_wash_iron, sort_order) VALUES
  ('Shirt', 'tops', 30, 15, 40, 1),
  ('T-Shirt', 'tops', 25, 12, 35, 2),
  ('Pants / Trousers', 'bottoms', 40, 20, 55, 3),
  ('Jeans', 'bottoms', 45, 20, 60, 4),
  ('Saree', 'traditional', 60, 30, 80, 5),
  ('Kurta', 'traditional', 35, 18, 45, 6),
  ('Bed Sheet', 'household', 50, 25, 65, 7),
  ('Towel', 'household', 20, 10, 25, 8);

-- Seed default add-on services
INSERT INTO public.addon_services (name, description, category, booking_charge, icon_name, sort_order) VALUES
  ('Home Cleaning', 'Professional home cleaning service', 'home', 30, 'sparkles', 1),
  ('Electrical Work', 'Wiring, fixtures, repairs', 'utility', 30, 'zap', 2),
  ('Plumber', 'Plumbing repairs and installations', 'utility', 30, 'droplets', 3),
  ('Carpentry', 'Furniture repairs and installations', 'home', 30, 'hammer', 4),
  ('Pest Control', 'Pest extermination service', 'home', 30, 'bug', 5),
  ('AC Service', 'Air conditioner cleaning and repair', 'appliance', 30, 'wind', 6);
