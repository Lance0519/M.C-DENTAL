-- Create site_settings table for editable site content
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default promotion banner settings
INSERT INTO site_settings (id, key, value, description, category) VALUES
('setting_promo_title', 'promo_banner_title', 'Special Promotions', 'Title for the promotions banner section', 'promotions'),
('setting_promo_subtitle', 'promo_banner_subtitle', 'Limited time offers on selected dental services', 'Subtitle/description for the promotions banner section', 'promotions'),
('setting_promo_bg_image', 'promo_banner_bg_image', '', 'Background image URL for the promotions banner section', 'promotions')
ON CONFLICT (key) DO NOTHING;

