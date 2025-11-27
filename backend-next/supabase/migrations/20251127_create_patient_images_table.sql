-- Create patient_images table for storing patient dental/medical images
CREATE TABLE IF NOT EXISTS patient_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    image_type VARCHAR(100), -- e.g., 'xray', 'photo', 'scan', 'treatment'
    taken_date DATE,
    uploaded_by VARCHAR(255), -- staff/doctor who uploaded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by patient
CREATE INDEX IF NOT EXISTS idx_patient_images_patient_id ON patient_images(patient_id);

-- Create index for sorting by date
CREATE INDEX IF NOT EXISTS idx_patient_images_created_at ON patient_images(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE patient_images IS 'Stores dental/medical images for patients with descriptions';
COMMENT ON COLUMN patient_images.image_url IS 'Base64 encoded image or URL to stored image';
COMMENT ON COLUMN patient_images.description IS 'Description of what the image shows';
COMMENT ON COLUMN patient_images.image_type IS 'Category of image (xray, photo, scan, treatment, etc.)';

