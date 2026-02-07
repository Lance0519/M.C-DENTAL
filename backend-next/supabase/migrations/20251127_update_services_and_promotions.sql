-- M.C. Dental Clinic - Updated Services and Promotions
-- Based on actual clinic price list

-- =====================
-- CLEAR EXISTING DATA
-- =====================
DELETE FROM services;
DELETE FROM promotions;

-- =====================
-- DENTAL SERVICES
-- =====================
INSERT INTO services (id, name, description, duration, price, active) VALUES

-- CONSULTATION
('srv001', 'Consultation', 'Initial dental consultation and assessment. Fee is FREE if you avail any dental procedures.', '15 minutes', '500', true),

-- TOOTH EXTRACTION
('srv002', 'Simple Tooth Extraction', 'Safe and painless simple tooth removal. Price is per tooth (minimum).', '30-45 minutes', '500', true),
('srv003', 'Wisdom Tooth Extraction', 'Professional wisdom tooth removal. Price is per tooth (minimum).', '45-60 minutes', '3000', true),
('srv004', 'Impacted Wisdom Tooth Extraction', 'Surgical removal of impacted wisdom teeth. Limited time offer! Price range: ₱8,000 - ₱10,000 per tooth.', '60-90 minutes', '8000', true),

-- CLEANING & FILLINGS
('srv005', 'Dental Cleaning', 'Professional teeth cleaning and polishing. Starting amount for mild/light cases. Additional fees for above light cases.', '30-45 minutes', '500', true),
('srv006', 'Pasta/Dental Fillings', 'Restore damaged teeth with quality fillings. Starting amount for mild/light cases. Additional fees for above light cases.', '30-45 minutes', '500', true),

-- DENTURES (per arch)
('srv007', 'Dentures (1-3 teeth missing)', 'Removable partial dentures for 1-3 missing teeth per arch.', '60-90 minutes', '5000', true),
('srv008', 'Dentures (4-5 teeth missing)', 'Removable partial dentures for 4-5 missing teeth per arch.', '60-90 minutes', '5500', true),
('srv009', 'Dentures (6-7 teeth missing)', 'Removable partial dentures for 6-7 missing teeth per arch.', '60-90 minutes', '6000', true),
('srv010', 'Dentures (8+ teeth missing)', 'Removable dentures for 8 or more missing teeth per arch.', '60-90 minutes', '7000', true),

-- ROOT CANAL & CROWNS
('srv011', 'Root Canal Treatment', 'Save infected teeth with root canal therapy. Price is per canal.', '60-90 minutes', '7000', true),
('srv012', 'Jacket/Crown (Porcelain Fused to Metal)', 'Custom-made dental crowns for damaged teeth. Porcelain fused to metal. Price is per unit.', '60 minutes', '6000', true),

-- VENEERS
('srv013', 'Dental Veneers', 'Cosmetic veneers to enhance your smile. Price range: ₱3,500 - ₱5,000 per unit.', '60 minutes', '3500', true),

-- TEETH WHITENING
('srv014', 'Teeth Whitening (2 Cycles)', 'Professional teeth whitening - 2 cycles with FREE light case cleaning included.', '60 minutes', '6000', true),
('srv015', 'Teeth Whitening (3 Cycles)', 'Professional teeth whitening - 3 cycles with FREE light case cleaning included.', '90 minutes', '8000', true),

-- X-RAY
('srv016', 'Panoramic X-Ray', 'Full mouth panoramic digital X-ray imaging.', '15 minutes', '1000', true),
('srv017', 'Periapical X-Ray', 'Single tooth periapical X-ray imaging.', '10 minutes', '300', true),

-- ORAL SURGERY
('srv018', 'Oral Surgery', 'Specialized oral surgical procedures. Price range: ₱8,000 - ₱10,000 per unit.', '60-90 minutes', '8000', true),

-- BRACES (for reference/booking)
('srv019', 'Metal Braces (Upper AND Lower)', 'Orthodontic treatment with metal braces for both upper and lower teeth. Total Package: ₱30,000 starting price (varies by case severity).', '60-90 minutes', '30000', true),
('srv020', 'Metal Braces (Upper OR Lower Only)', 'Orthodontic treatment with metal braces for either upper or lower teeth. Total Package: ₱20,000 starting price.', '60-90 minutes', '20000', true),
('srv021', 'Braces Removal', 'Removal of existing braces with FREE light case cleaning included.', '45-60 minutes', '2000', true),
('srv022', 'Monthly Braces Adjustment (Upper & Lower)', 'Regular monthly adjustment for upper and lower braces.', '30 minutes', '1000', true),
('srv023', 'Monthly Braces Adjustment (Single Arch)', 'Regular monthly adjustment for single arch braces.', '20 minutes', '500', true);

-- =====================
-- PROMOTIONS
-- =====================
INSERT INTO promotions (id, title, description, discount_percentage, valid_from, valid_until, active) VALUES

-- Ber Months Promo
('promo001', '❄️ Ber Months Promo - Upper & Lower Metal Braces', 
'Get your perfect smile this holiday season! 

💰 Down Payment: ₱3,500
📅 Monthly Adjustment: ₱1,000
✨ Total Package: ₱30,000 starting price

🎁 PROMO INCLUSIONS/FREEBIES:
• Panoramic X-Ray
• Light Case Cleaning
• 1 Simple Bunot (Extraction)
• 1 Pasta (Molars not previously restored)
• Retainer After Braces (T&C applied)
• Fluoride After Braces
• Intra & Extra Oral Photos
• Unli Gum Sore Treatment
• Ortho Kit

⚡ POSSIBLE SAME DAY INSTALLATION!', 
0, CURRENT_DATE, '2025-12-31', true),

('promo002', '❄️ Ber Months Promo - Upper OR Lower Metal Braces', 
'Single arch braces at an affordable price!

💰 Down Payment: ₱3,000
📅 Monthly Adjustment: ₱500
✨ Total Package: ₱20,000 starting price

🎁 PROMO INCLUSIONS/FREEBIES:
• Panoramic X-Ray
• Light Case Cleaning
• Intra & Extra Oral Photos
• Ortho Kit

⚡ POSSIBLE SAME DAY INSTALLATION!', 
0, CURRENT_DATE, '2025-12-31', true),

('promo003', 'FREE Consultation with Any Procedure', 
'Book any dental procedure and get your ₱500 consultation fee absolutely FREE! 

This applies to all dental services including:
• Tooth Extraction
• Dental Cleaning
• Fillings
• Root Canal
• And more!', 
100, CURRENT_DATE, '2025-12-31', true),

('promo004', 'Impacted Wisdom Tooth Special', 
'LIMITED TIME OFFER! 

Get your impacted wisdom tooth extracted at a special price of ₱8,000 - ₱10,000 per tooth.

Includes:
• Professional surgical extraction
• Local anesthesia
• Post-operative care instructions
• Follow-up consultation', 
0, CURRENT_DATE, '2025-12-31', true),

('promo005', 'Teeth Whitening Bundle', 
'Brighten your smile this holiday season! 

2 Cycles - ₱6,000 with FREE light case cleaning
3 Cycles - ₱8,000 with FREE light case cleaning

Perfect for the holiday season! ✨', 
0, CURRENT_DATE, '2025-12-31', true);

-- =====================
-- SUCCESS MESSAGE
-- =====================
SELECT 'Services and Promotions updated successfully!' as message;
SELECT COUNT(*) as total_services FROM services;
SELECT COUNT(*) as total_promotions FROM promotions;

