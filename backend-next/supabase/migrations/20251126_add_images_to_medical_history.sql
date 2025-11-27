-- Add images column to medical_history table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_history' AND column_name = 'images'
  ) THEN
    ALTER TABLE medical_history ADD COLUMN images JSONB;
  END IF;
END $$;

-- Add index for faster queries on medical history by patient
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_id ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_record_date ON medical_history(record_date DESC);

