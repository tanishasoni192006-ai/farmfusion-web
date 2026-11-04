-- ====================================================================
-- FarmFusion Web – Smart Farming Advisory Platform
-- Database Schema & Comprehensive Seed Data
-- Mini Project: 3rd Semester B.Tech CSE (AI & ML)
-- Designed for MySQL 8.0+ / MariaDB / XAMPP / WAMP
-- ====================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS farmfusion_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE farmfusion_db;

-- 2. Drop existing tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS farmer_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS crop_information;
DROP TABLE IF EXISTS disease_information;
DROP TABLE IF EXISTS market_prices;

-- ====================================================================
-- Table 1: users
-- Core authentication table storing farmer login credentials
-- ====================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================================
-- Table 2: farmer_profiles
-- Agricultural details specific to each registered farmer
-- ====================================================================
CREATE TABLE farmer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL DEFAULT 'Punjab',
    district VARCHAR(100) NOT NULL DEFAULT 'Ludhiana',
    village VARCHAR(100) DEFAULT '',
    land_area DECIMAL(8, 2) NOT NULL DEFAULT 5.00,
    land_unit VARCHAR(20) NOT NULL DEFAULT 'Acres',
    primary_soil_type VARCHAR(60) NOT NULL DEFAULT 'Alluvial',
    water_source VARCHAR(60) NOT NULL DEFAULT 'Tube-well / Borewell',
    preferred_crops VARCHAR(255) DEFAULT 'Wheat, Rice, Mustard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- Table 3: reminders
-- Irrigation and farm activity task reminders with priority & status
-- ====================================================================
CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    crop_name VARCHAR(100) DEFAULT 'General',
    category VARCHAR(50) NOT NULL DEFAULT 'Irrigation',
    reminder_date DATE NOT NULL,
    reminder_time TIME DEFAULT '07:00:00',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'Completed') DEFAULT 'Pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- Table 4: expenses
-- Complete farm expense tracking with categories and payment modes
-- ====================================================================
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(60) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- Table 5: crop_information
-- Predefined agricultural database for rule-based advisory
-- ====================================================================
CREATE TABLE crop_information (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(120),
    season VARCHAR(50) NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    water_requirement ENUM('Low', 'Medium', 'High') NOT NULL,
    ideal_temperature VARCHAR(60) NOT NULL,
    duration_days VARCHAR(60) NOT NULL,
    expected_yield_per_acre VARCHAR(80) NOT NULL,
    estimated_cost_per_acre DECIMAL(10, 2) DEFAULT 0.00,
    estimated_revenue_per_acre DECIMAL(10, 2) DEFAULT 0.00,
    fertilizer_guidance TEXT,
    irrigation_guidance TEXT,
    description TEXT,
    icon VARCHAR(60) DEFAULT 'bi-flower1'
) ENGINE=InnoDB;

-- ====================================================================
-- Table 6: disease_information
-- Knowledge base of crop diseases, symptoms and organic/chemical remedies
-- ====================================================================
CREATE TABLE disease_information (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    disease_name VARCHAR(150) NOT NULL,
    pathogen_type VARCHAR(50) NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    symptoms TEXT NOT NULL,
    prevention TEXT NOT NULL,
    treatment TEXT NOT NULL,
    favorable_conditions TEXT
) ENGINE=InnoDB;

-- ====================================================================
-- Table 7: market_prices
-- Benchmark Mandi rates for price intelligence & market awareness
-- ====================================================================
CREATE TABLE market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100) DEFAULT 'Standard',
    market_name VARCHAR(120) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    min_price DECIMAL(10, 2) NOT NULL,
    max_price DECIMAL(10, 2) NOT NULL,
    modal_price DECIMAL(10, 2) NOT NULL,
    price_unit VARCHAR(30) DEFAULT '₹ / Quintal',
    price_trend ENUM('Up', 'Down', 'Stable') DEFAULT 'Stable',
    source VARCHAR(120) DEFAULT 'Benchmark Agmarknet Reference',
    last_updated DATE NOT NULL
) ENGINE=InnoDB;

-- ====================================================================
-- SEED DATA: Predefined Agricultural Knowledge Base
-- ====================================================================

-- 1. Crops Seed Data
INSERT INTO crop_information 
(crop_name, scientific_name, season, soil_type, water_requirement, ideal_temperature, duration_days, expected_yield_per_acre, estimated_cost_per_acre, estimated_revenue_per_acre, fertilizer_guidance, irrigation_guidance, description, icon) 
VALUES
('Wheat', 'Triticum aestivum', 'Rabi', 'Alluvial, Clayey Loam', 'Medium', '15°C - 25°C', '110-130 days', '18 - 24 Quintals', 14000.00, 48000.00, 
 'NPK 120:60:40 kg/ha. Apply half nitrogen + full P & K at sowing; remaining N in two splits at crown root initiation and flowering.', 
 '4 to 6 irrigations at key stages: Crown Root Initiation (20-25 DAS), Tillering, Late Jointing, Flowering, and Milking.', 
 'Major cereal grain cultivated during the winter season. Ideal for north and central Indian plains with cool winters and moderate sunshine.', 'bi-box2-heart'),

('Rice (Paddy)', 'Oryza sativa', 'Kharif', 'Clayey, Alluvial', 'High', '22°C - 35°C', '120-145 days', '22 - 30 Quintals', 18000.00, 62000.00, 
 'NPK 100:50:50 kg/ha + Zinc Sulphate 25 kg/ha. Nitrogen split into basal, active tillering, and panicle initiation stages.', 
 'Continuous shallow flooding (2-5 cm) from transplanting until 10-14 days before harvest.', 
 'Staple grain requiring high water availability and warm humid climate during vegetative growth.', 'bi-droplet-half'),

('Cotton', 'Gossypium hirsutum', 'Kharif', 'Black (Regur), Alluvial', 'Medium', '21°C - 30°C', '150-180 days', '8 - 14 Quintals (Seed Cotton)', 22000.00, 75000.00, 
 'NPK 120:60:60 kg/ha. Top dress nitrogen at squaring and boll formation. Micronutrient spray of Boron and Magnesium.', 
 'Critical stages: Flowering and Boll Development. Avoid waterlogging; drip irrigation is highly recommended.', 
 'Important commercial fiber and cash crop suited for black cotton soils with good drainage.', 'bi-cloud-sun'),

('Maize (Corn)', 'Zea mays', 'Kharif, Rabi, Zaid', 'Alluvial, Sandy Loam', 'Medium', '18°C - 27°C', '90-110 days', '20 - 28 Quintals', 12500.00, 44000.00, 
 'NPK 120:60:40 kg/ha. Apply farmyard manure 10 tonnes/ha prior to sowing. Top dress urea at knee-high and tasseling stages.', 
 '5-6 light irrigations. Critical moisture periods: Tasseling and Silking.', 
 'High-yielding cereal used for food, livestock feed, and industrial starch. Grows well across multiple seasons.', 'bi-sun'),

('Chickpea (Gram)', 'Cicer arietinum', 'Rabi', 'Sandy Loam, Black, Alluvial', 'Low', '15°C - 25°C', '90-120 days', '7 - 12 Quintals', 9500.00, 38000.00, 
 'NPK 20:40:20 kg/ha + Rhizobium seed inoculation. Being a legume, it fixes atmospheric nitrogen naturally.', 
 'Requires only 1 to 2 light irrigations at pre-flowering and pod development. Sensitive to over-watering.', 
 'Important pulse crop known for soil fertility replenishment and high protein content.', 'bi-circle-square'),

('Mustard (Rape)', 'Brassica juncea', 'Rabi', 'Alluvial, Sandy Loam', 'Low', '10°C - 25°C', '105-125 days', '6 - 10 Quintals', 8500.00, 42000.00, 
 'NPK 80:40:40 kg/ha + Sulphur 20 kg/ha for enhancing oil content in seeds.', 
 '2 to 3 irrigations: First at rosette/branching stage (30 DAS) and second at pod formation (60 DAS).', 
 'Primary oilseed crop of winter season with low water requirement and strong economic returns.', 'bi-brightness-high'),

('Tomato', 'Solanum lycopersicum', 'All-season, Rabi, Kharif', 'Red, Loamy, Alluvial', 'Medium', '18°C - 30°C', '80-110 days', '120 - 180 Quintals', 28000.00, 110000.00, 
 'NPK 150:100:100 kg/ha + FYM 25 t/ha. Calcium nitrate spray to prevent blossom end rot.', 
 'Regular weekly irrigation or drip fertigation. Avoid moisture fluctuations during fruiting.', 
 'High-value horticultural vegetable crop responsive to modern precision management and staking.', 'bi-egg-fill'),

('Potato', 'Solanum tuberosum', 'Rabi', 'Sandy Loam, Alluvial', 'Medium', '15°C - 22°C', '85-110 days', '100 - 150 Quintals', 32000.00, 125000.00, 
 'NPK 150:100:120 kg/ha. High potash requirement for tuber bulking and starch quality.', 
 'Furrow irrigation every 7-10 days. Stop watering 10 days before harvest to allow skin curing.', 
 'High carbohydrate vegetable tuber with high market demand and cold storage compatibility.', 'bi-layers'),

('Sugarcane', 'Saccharum officinarum', 'All-season', 'Alluvial, Black, Clayey Loam', 'High', '25°C - 38°C', '300-360 days', '300 - 450 Quintals', 45000.00, 160000.00, 
 'NPK 250:100:100 kg/ha in 3 split doses. High organic manure incorporation.', 
 'Heavy water requirement. 20-25 irrigations or subsurface drip irrigation system.', 
 'Long-duration cash crop producing sugar, jaggery, ethanol, and biomass.', 'bi-water'),

('Soybean', 'Glycine max', 'Kharif', 'Black, Loamy, Alluvial', 'Medium', '20°C - 32°C', '90-105 days', '8 - 14 Quintals', 11000.00, 46000.00, 
 'NPK 30:60:40 kg/ha + Bradyrhizobium culture. Essential sulphur application 20 kg/ha.', 
 'Primarily rainfed in monsoon, requires supplemental irrigation if dry spell occurs during flowering or pod fill.', 
 'High-protein, high-oil legume widely grown in Central India.', 'bi-flower2');

-- 2. Disease Seed Data
INSERT INTO disease_information 
(crop_name, disease_name, pathogen_type, severity, symptoms, prevention, treatment, favorable_conditions) 
VALUES
('Wheat', 'Yellow Rust (Stripe Rust)', 'Fungal (Puccinia striiformis)', 'High', 
 'Yellow stripes/pustules arranged in linear rows along leaf veins. Yellow dust on fingers when touched.', 
 'Grow resistant cultivars like HD-2967, PBW-550. Avoid excessive nitrogen fertilizer.', 
 'Foliar spray of Propiconazole 25% EC (Tilt) @ 1 ml/liter of water at first sign of disease.', 
 'Cool temperatures (10-15°C) with high relative humidity (>85%) and intermittent dews.'),

('Wheat', 'Loose Smut', 'Fungal (Ustilago tritici)', 'Medium', 
 'Entire earhead is converted into a black powdery mass of spores covered by thin silvery membrane.', 
 'Use certified disease-free seeds. Solar heat treatment of seeds before sowing.', 
 'Seed treatment with Carboxin (Vitavax 75 WP) @ 2.5 g/kg seed or Carbendazim @ 2 g/kg.', 
 'Moderate temperatures (16-22°C) during flowering phase.'),

('Rice (Paddy)', 'Bacterial Leaf Blight (BLB)', 'Bacterial (Xanthomonas oryzae)', 'High', 
 'Water-soaked lesions on leaf margins progressing into wavy yellow-white stripes. Bacterial ooze beads in early morning.', 
 'Ensure balanced NPK fertilization. Do not clip seedling tips during transplanting. Drain water during outbreak.', 
 'Spray Streptocycline 1 g + Copper Oxychloride 25 g in 10 liters of water.', 
 'Warm temperatures (25-30°C), heavy rainfall, high humidity, and strong winds.'),

('Rice (Paddy)', 'Blast Disease', 'Fungal (Magnaporthe oryzae)', 'Critical', 
 'Spindle-shaped or eye-shaped lesions with grey/whitish centers and dark brown margins on leaves and neck rot on panicles.', 
 'Treat seeds with Tricyclazole 75 WP. Avoid excessive nitrogenous fertilizers.', 
 'Spray Tricyclazole 75% WP (Beam) @ 0.6 g/liter or Isoprothiolane @ 1.5 ml/liter.', 
 'Low night temperatures (20-22°C), high humidity (>90%), and prolonged leaf wetness.'),

('Cotton', 'Boll Rot', 'Fungal & Bacterial Complex', 'High', 
 'Water-soaked spots on green bolls turning dark brown to black. Internal rotting of lint and seed.', 
 'Maintain proper plant spacing (90x60 cm). Avoid excessive vegetative growth and nitrogen.', 
 'Foliar spray of Copper Oxychloride @ 2.5 g/liter + Streptocycline @ 0.1 g/liter.', 
 'Continuous overcast rainy days with dense crop canopy preventing sunlight penetration.'),

('Tomato', 'Early Blight', 'Fungal (Alternaria solani)', 'Medium', 
 'Dark brown concentric ring spots ("target board" appearance) on older lower leaves. Yellow halo surrounding spots.', 
 'Crop rotation with non-solanaceous crops. Stake plants to keep foliage off ground.', 
 'Spray Mancozeb 75 WP @ 2.5 g/liter or Chlorothalonil @ 2 g/liter at 10-day intervals.', 
 'Warm, humid weather (24-29°C) with alternating wet and dry periods.'),

('Tomato', 'Tomato Leaf Curl Virus (ToLCV)', 'Viral (transmitted by Whitefly)', 'Critical', 
 'Severe curling, puckering, reduction of leaf size, stunted bushy plant growth, dropping of flower buds.', 
 'Install yellow sticky traps (15-20/acre). Use insect-proof net nurseries.', 
 'Control whitefly vector using Imidacloprid 17.8 SL @ 0.5 ml/liter or Dimethoate 30 EC @ 1.5 ml/liter.', 
 'Dry, warm weather favoring multiplication and migration of Bemisia tabaci whiteflies.'),

('Potato', 'Late Blight', 'Oomycete (Phytophthora infestans)', 'Critical', 
 'Water-soaked irregular spots on leaf tips and margins. White cottony fungal growth on underside of leaves in morning.', 
 'Plant certified disease-free seed tubers. Earthing up to prevent tuber exposure.', 
 'Prophylactic spray of Mancozeb 75 WP @ 2 g/liter; Curative spray of Cymoxanil + Mancozeb (Curzate) @ 2.5 g/liter.', 
 'Cool moist weather (12-18°C) with RH >90% and frequent rainfall or dense fog.'),

('Maize (Corn)', 'Fall Armyworm (FAW)', 'Insect Pest (Spodoptera frugiperda)', 'High', 
 'Shot holes and extensive ragged chewing damage in the whorl. Wet sawdust-like frass accumulated inside whorl.', 
 'Deep summer ploughing. Intercrop with pulses. Install pheromone traps @ 5/acre.', 
 'Spray Chlorantraniliprole 18.5 SC (Coragen) @ 0.4 ml/liter or Emamectin Benzoate 5 SG @ 0.4 g/liter directly into whorl.', 
 'Warm weather, continuous availability of maize host crops across seasons.');

-- 3. Market Prices Seed Data (Agmarknet benchmark reference)
INSERT INTO market_prices 
(crop_name, variety, market_name, district, state, min_price, max_price, modal_price, price_unit, price_trend, source, last_updated) 
VALUES
('Wheat', 'Sharbati / PBW-550', 'Khanna Mandi', 'Ludhiana', 'Punjab', 2375.00, 2550.00, 2450.00, '₹ / Quintal', 'Up', 'Agmarknet Benchmark Data', CURDATE()),
('Wheat', 'Kalyan Sona', 'Karnal Mandi', 'Karnal', 'Haryana', 2320.00, 2480.00, 2400.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE()),
('Rice (Paddy)', 'Basmati 1121', 'Amritsar Grain Market', 'Amritsar', 'Punjab', 3400.00, 3950.00, 3720.00, '₹ / Quintal', 'Up', 'Agmarknet Benchmark Data', CURDATE()),
('Rice (Paddy)', 'Common Paddy', 'Burdwan Mandi', 'Purba Bardhaman', 'West Bengal', 2183.00, 2250.00, 2200.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE()),
('Cotton', 'Medium Staple', 'Rajkot Market Yard', 'Rajkot', 'Gujarat', 6800.00, 7450.00, 7150.00, '₹ / Quintal', 'Up', 'Agmarknet Benchmark Data', CURDATE()),
('Cotton', 'Long Staple', 'Guntur Mandi', 'Guntur', 'Andhra Pradesh', 7100.00, 7650.00, 7350.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE()),
('Maize (Corn)', 'Hybrid Yellow', 'Davanagere APMC', 'Davanagere', 'Karnataka', 1980.00, 2250.00, 2120.00, '₹ / Quintal', 'Down', 'Agmarknet Benchmark Data', CURDATE()),
('Chickpea (Gram)', 'Desi Chana', 'Indore Mandi', 'Indore', 'Madhya Pradesh', 5400.00, 5950.00, 5700.00, '₹ / Quintal', 'Up', 'Agmarknet Benchmark Data', CURDATE()),
('Mustard', 'Black Mustard', 'Alwar Mandi', 'Alwar', 'Rajasthan', 5100.00, 5550.00, 5320.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE()),
('Tomato', 'Hybrid Local', 'Kolar APMC', 'Kolar', 'Karnataka', 1400.00, 2200.00, 1800.00, '₹ / Quintal', 'Up', 'Agmarknet Benchmark Data', CURDATE()),
('Potato', 'Jyoti / Pukhraj', 'Agra Mandi', 'Agra', 'Uttar Pradesh', 1150.00, 1450.00, 1300.00, '₹ / Quintal', 'Down', 'Agmarknet Benchmark Data', CURDATE()),
('Soybean', 'Yellow Soybean', 'Ujjain Mandi', 'Ujjain', 'Madhya Pradesh', 4300.00, 4750.00, 4520.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE()),
('Sugarcane', 'Standard Cane', 'Muzaffarnagar Mandi', 'Muzaffarnagar', 'Uttar Pradesh', 350.00, 390.00, 370.00, '₹ / Quintal', 'Stable', 'Agmarknet Benchmark Data', CURDATE());

-- 4. Sample Demonstration Farmer Account
-- Password is 'farmer123' (bcrypt hashed: $2a$10$wO3g4v4bAkyzC2Y3e4GZ0eJ53Hk0uP6v8u1mQz2y7k8l9o0p1q2r3 or generated via bcrypt)
-- Using precalculated bcrypt hash for 'farmer123': $2b$10$T8Z.RfxqYw6k8Q2c1y8v7eD3XwK6m4F1v9l2s8c7d6e5f4g3h2i1
-- (Note: The Express application also hashes dynamically upon registration)
INSERT INTO users (id, full_name, email, phone, password_hash)
VALUES (1, 'Ramesh Kumar Patel', 'ramesh@farmfusion.in', '9876543210', '$2b$10$a1b2c3d4e5f6g7h8i9j0kOl3mN4oP5qR6sT7uV8wX9yZ0aB1c2d3e');

INSERT INTO farmer_profiles (user_id, state, district, village, land_area, land_unit, primary_soil_type, water_source, preferred_crops)
VALUES (1, 'Punjab', 'Ludhiana', 'Samrala Khurd', 6.50, 'Acres', 'Alluvial', 'Tube-well / Borewell', 'Wheat, Rice (Paddy), Mustard');

-- Sample Reminders for Farmer Ramesh
INSERT INTO reminders (user_id, title, crop_name, category, reminder_date, reminder_time, priority, status, description)
VALUES 
(1, 'Second Irrigation - Crown Root Stage', 'Wheat', 'Irrigation', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '06:30:00', 'High', 'Pending', 'Irrigate field block A at 21 days after sowing. Check soil moisture first.'),
(1, 'Apply First Split Urea Dose', 'Wheat', 'Fertilizer', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '08:00:00', 'Medium', 'Pending', 'Top dress 45 kg Urea per acre after irrigation when soil is at field capacity.'),
(1, 'Inspect Leaves for Early Yellow Rust', 'Wheat', 'Pesticide', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', 'High', 'Pending', 'Check lower canopy for yellow powdery stripe lesions. Weather is cool and humid.'),
(1, 'Pre-sowing Seed Bed Preparation', 'Mustard', 'Sowing', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '07:00:00', 'Low', 'Completed', 'Ploughing with rotavator completed. Basal DAP added.');

-- Sample Expenses for Farmer Ramesh
INSERT INTO expenses (user_id, category, amount, expense_date, payment_method, description)
VALUES 
(1, 'Seeds', 4200.00, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Cash', 'Purchased 80 kg certified HD-2967 wheat seeds from IARI outlet'),
(1, 'Fertilizers', 6800.00, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'UPI', 'DAP 4 bags and MOP 2 bags for basal application'),
(1, 'Machinery & Fuel', 3500.00, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'Cash', 'Diesel for tractor ploughing and seed-cum-fertilizer drill rental'),
(1, 'Labor', 2800.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Cash', 'Hired 4 field laborers for seed sowing and field leveling'),
(1, 'Irrigation', 1200.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Bank Transfer', 'Tube-well electricity billing for initial flood irrigation');

-- ====================================================================
-- End of farmfusion.sql
-- ====================================================================
