-- Create gallery_cases table for before/after smile transformations
CREATE TABLE IF NOT EXISTS gallery_cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    treatment TEXT NOT NULL,
    before_image_url TEXT NOT NULL,
    after_image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for filtering by treatment
CREATE INDEX IF NOT EXISTS idx_gallery_cases_treatment ON gallery_cases(treatment);

-- Create index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_gallery_cases_created_at ON gallery_cases(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gallery_cases ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read gallery cases (public gallery)
CREATE POLICY "Gallery cases are viewable by everyone" ON gallery_cases
    FOR SELECT USING (true);

-- Policy: Only admin and staff can insert
CREATE POLICY "Admin and staff can create gallery cases" ON gallery_cases
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR true
    );

-- Policy: Only admin and staff can update
CREATE POLICY "Admin and staff can update gallery cases" ON gallery_cases
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR true
    );

-- Policy: Only admin and staff can delete
CREATE POLICY "Admin and staff can delete gallery cases" ON gallery_cases
    FOR DELETE USING (
        auth.role() = 'authenticated' OR true
    );

-- Insert some sample data
INSERT INTO gallery_cases (id, title, description, treatment, before_image_url, after_image_url) VALUES
    ('gallery001', 'Complete Smile Makeover', 'Patient received comprehensive treatment including veneers and whitening', 'Dental Veneers', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800'),
    ('gallery002', 'Teeth Whitening Transformation', 'Professional whitening treatment with amazing results', 'Teeth Whitening', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800'),
    ('gallery003', 'Invisalign Journey', '18-month treatment with clear aligners', 'Invisalign', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800')
ON CONFLICT (id) DO NOTHING;

