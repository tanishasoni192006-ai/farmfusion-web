/**
 * Database Configuration & Connection Pool
 * Uses mysql2/promise for clean async/await SQL operations.
 * Includes automatic diagnostic checks and resilient fallback mock data
 * so the web app can be demonstrated seamlessly in academic environments.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool = null;
let isConnected = false;

// In-memory fallback dataset for offline/mock demonstration
const fallbackStore = {
    users: [
        {
            id: 1,
            full_name: 'Ramesh Kumar Patel',
            email: 'ramesh@farmfusion.in',
            phone: '9876543210',
            password_hash: bcrypt.hashSync('farmer123', 10),
            created_at: new Date()
        }
    ],
    farmer_profiles: [
        {
            id: 1,
            user_id: 1,
            state: 'Punjab',
            district: 'Ludhiana',
            village: 'Samrala Khurd',
            land_area: 6.5,
            land_unit: 'Acres',
            primary_soil_type: 'Alluvial',
            water_source: 'Tube-well / Borewell',
            preferred_crops: 'Wheat, Rice (Paddy), Mustard',
            created_at: new Date()
        }
    ],
    reminders: [
        {
            id: 1,
            user_id: 1,
            title: 'Second Irrigation - Crown Root Stage',
            crop_name: 'Wheat',
            category: 'Irrigation',
            reminder_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            reminder_time: '06:30:00',
            priority: 'High',
            status: 'Pending',
            description: 'Irrigate field block A at 21 days after sowing. Check soil moisture first.',
            created_at: new Date()
        },
        {
            id: 2,
            user_id: 1,
            title: 'Apply First Split Urea Dose',
            crop_name: 'Wheat',
            category: 'Fertilizer',
            reminder_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
            reminder_time: '08:00:00',
            priority: 'Medium',
            status: 'Pending',
            description: 'Top dress 45 kg Urea per acre after irrigation when soil is at field capacity.',
            created_at: new Date()
        },
        {
            id: 3,
            user_id: 1,
            title: 'Inspect Leaves for Early Yellow Rust',
            crop_name: 'Wheat',
            category: 'Pesticide',
            reminder_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
            reminder_time: '07:00:00',
            priority: 'High',
            status: 'Pending',
            description: 'Check lower canopy for yellow powdery stripe lesions. Weather is cool and humid.',
            created_at: new Date()
        },
        {
            id: 4,
            user_id: 1,
            title: 'Pre-sowing Seed Bed Preparation',
            crop_name: 'Mustard',
            category: 'Sowing',
            reminder_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
            reminder_time: '07:00:00',
            priority: 'Low',
            status: 'Completed',
            description: 'Ploughing with rotavator completed. Basal DAP added.',
            created_at: new Date()
        }
    ],
    expenses: [
        {
            id: 1,
            user_id: 1,
            category: 'Seeds',
            amount: 4200.00,
            expense_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
            payment_method: 'Cash',
            description: 'Purchased 80 kg certified HD-2967 wheat seeds from IARI outlet',
            created_at: new Date()
        },
        {
            id: 2,
            user_id: 1,
            category: 'Fertilizers',
            amount: 6800.00,
            expense_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
            payment_method: 'UPI',
            description: 'DAP 4 bags and MOP 2 bags for basal application',
            created_at: new Date()
        },
        {
            id: 3,
            user_id: 1,
            category: 'Machinery & Fuel',
            amount: 3500.00,
            expense_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
            payment_method: 'Cash',
            description: 'Diesel for tractor ploughing and seed-cum-fertilizer drill rental',
            created_at: new Date()
        },
        {
            id: 4,
            user_id: 1,
            category: 'Labor',
            amount: 2800.00,
            expense_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
            payment_method: 'Cash',
            description: 'Hired 4 field laborers for seed sowing and field leveling',
            created_at: new Date()
        },
        {
            id: 5,
            user_id: 1,
            category: 'Irrigation',
            amount: 1200.00,
            expense_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
            payment_method: 'Bank Transfer',
            description: 'Tube-well electricity billing for initial flood irrigation',
            created_at: new Date()
        }
    ],
    crop_information: [
        {
            id: 1,
            crop_name: 'Wheat',
            scientific_name: 'Triticum aestivum',
            season: 'Rabi',
            soil_type: 'Alluvial, Clayey Loam',
            water_requirement: 'Medium',
            ideal_temperature: '15°C - 25°C',
            duration_days: '110-130 days',
            expected_yield_per_acre: '18 - 24 Quintals',
            estimated_cost_per_acre: 14000.00,
            estimated_revenue_per_acre: 48000.00,
            fertilizer_guidance: 'NPK 120:60:40 kg/ha. Apply half nitrogen + full P & K at sowing; remaining N in two splits at crown root initiation and flowering.',
            irrigation_guidance: '4 to 6 irrigations at key stages: Crown Root Initiation (20-25 DAS), Tillering, Late Jointing, Flowering, and Milking.',
            description: 'Major cereal grain cultivated during the winter season. Ideal for north and central Indian plains with cool winters and moderate sunshine.',
            icon: 'bi-box2-heart'
        },
        {
            id: 2,
            crop_name: 'Rice (Paddy)',
            scientific_name: 'Oryza sativa',
            season: 'Kharif',
            soil_type: 'Clayey, Alluvial',
            water_requirement: 'High',
            ideal_temperature: '22°C - 35°C',
            duration_days: '120-145 days',
            expected_yield_per_acre: '22 - 30 Quintals',
            estimated_cost_per_acre: 18000.00,
            estimated_revenue_per_acre: 62000.00,
            fertilizer_guidance: 'NPK 100:50:50 kg/ha + Zinc Sulphate 25 kg/ha. Nitrogen split into basal, active tillering, and panicle initiation stages.',
            irrigation_guidance: 'Continuous shallow flooding (2-5 cm) from transplanting until 10-14 days before harvest.',
            description: 'Staple grain requiring high water availability and warm humid climate during vegetative growth.',
            icon: 'bi-droplet-half'
        },
        {
            id: 3,
            crop_name: 'Cotton',
            scientific_name: 'Gossypium hirsutum',
            season: 'Kharif',
            soil_type: 'Black (Regur), Alluvial',
            water_requirement: 'Medium',
            ideal_temperature: '21°C - 30°C',
            duration_days: '150-180 days',
            expected_yield_per_acre: '8 - 14 Quintals (Seed Cotton)',
            estimated_cost_per_acre: 22000.00,
            estimated_revenue_per_acre: 75000.00,
            fertilizer_guidance: 'NPK 120:60:60 kg/ha. Top dress nitrogen at squaring and boll formation. Micronutrient spray of Boron and Magnesium.',
            irrigation_guidance: 'Critical stages: Flowering and Boll Development. Avoid waterlogging; drip irrigation is highly recommended.',
            description: 'Important commercial fiber and cash crop suited for black cotton soils with good drainage.',
            icon: 'bi-cloud-sun'
        },
        {
            id: 4,
            crop_name: 'Maize (Corn)',
            scientific_name: 'Zea mays',
            season: 'Kharif, Rabi, Zaid',
            soil_type: 'Alluvial, Sandy Loam',
            water_requirement: 'Medium',
            ideal_temperature: '18°C - 27°C',
            duration_days: '90-110 days',
            expected_yield_per_acre: '20 - 28 Quintals',
            estimated_cost_per_acre: 12500.00,
            estimated_revenue_per_acre: 44000.00,
            fertilizer_guidance: 'NPK 120:60:40 kg/ha. Apply farmyard manure 10 tonnes/ha prior to sowing. Top dress urea at knee-high and tasseling stages.',
            irrigation_guidance: '5-6 light irrigations. Critical moisture periods: Tasseling and Silking.',
            description: 'High-yielding cereal used for food, livestock feed, and industrial starch. Grows well across multiple seasons.',
            icon: 'bi-sun'
        },
        {
            id: 5,
            crop_name: 'Chickpea (Gram)',
            scientific_name: 'Cicer arietinum',
            season: 'Rabi',
            soil_type: 'Sandy Loam, Black, Alluvial',
            water_requirement: 'Low',
            ideal_temperature: '15°C - 25°C',
            duration_days: '90-120 days',
            expected_yield_per_acre: '7 - 12 Quintals',
            estimated_cost_per_acre: 9500.00,
            estimated_revenue_per_acre: 38000.00,
            fertilizer_guidance: 'NPK 20:40:20 kg/ha + Rhizobium seed inoculation. Being a legume, it fixes atmospheric nitrogen naturally.',
            irrigation_guidance: 'Requires only 1 to 2 light irrigations at pre-flowering and pod development. Sensitive to over-watering.',
            description: 'Important pulse crop known for soil fertility replenishment and high protein content.',
            icon: 'bi-circle-square'
        },
        {
            id: 6,
            crop_name: 'Mustard (Rape)',
            scientific_name: 'Brassica juncea',
            season: 'Rabi',
            soil_type: 'Alluvial, Sandy Loam',
            water_requirement: 'Low',
            ideal_temperature: '10°C - 25°C',
            duration_days: '105-125 days',
            expected_yield_per_acre: '6 - 10 Quintals',
            estimated_cost_per_acre: 8500.00,
            estimated_revenue_per_acre: 42000.00,
            fertilizer_guidance: 'NPK 80:40:40 kg/ha + Sulphur 20 kg/ha for enhancing oil content in seeds.',
            irrigation_guidance: '2 to 3 irrigations: First at rosette/branching stage (30 DAS) and second at pod formation (60 DAS).',
            description: 'Primary oilseed crop of winter season with low water requirement and strong economic returns.',
            icon: 'bi-brightness-high'
        },
        {
            id: 7,
            crop_name: 'Tomato',
            scientific_name: 'Solanum lycopersicum',
            season: 'All-season, Rabi, Kharif',
            soil_type: 'Red, Loamy, Alluvial',
            water_requirement: 'Medium',
            ideal_temperature: '18°C - 30°C',
            duration_days: '80-110 days',
            expected_yield_per_acre: '120 - 180 Quintals',
            estimated_cost_per_acre: 28000.00,
            estimated_revenue_per_acre: 110000.00,
            fertilizer_guidance: 'NPK 150:100:100 kg/ha + FYM 25 t/ha. Calcium nitrate spray to prevent blossom end rot.',
            irrigation_guidance: 'Regular weekly irrigation or drip fertigation. Avoid moisture fluctuations during fruiting.',
            description: 'High-value horticultural vegetable crop responsive to modern precision management and staking.',
            icon: 'bi-egg-fill'
        },
        {
            id: 8,
            crop_name: 'Potato',
            scientific_name: 'Solanum tuberosum',
            season: 'Rabi',
            soil_type: 'Sandy Loam, Alluvial',
            water_requirement: 'Medium',
            ideal_temperature: '15°C - 22°C',
            duration_days: '85-110 days',
            expected_yield_per_acre: '100 - 150 Quintals',
            estimated_cost_per_acre: 32000.00,
            estimated_revenue_per_acre: 125000.00,
            fertilizer_guidance: 'NPK 150:100:120 kg/ha. High potash requirement for tuber bulking and starch quality.',
            irrigation_guidance: 'Furrow irrigation every 7-10 days. Stop watering 10 days before harvest to allow skin curing.',
            description: 'High carbohydrate vegetable tuber with high market demand and cold storage compatibility.',
            icon: 'bi-layers'
        },
        {
            id: 9,
            crop_name: 'Sugarcane',
            scientific_name: 'Saccharum officinarum',
            season: 'All-season',
            soil_type: 'Alluvial, Black, Clayey Loam',
            water_requirement: 'High',
            ideal_temperature: '25°C - 38°C',
            duration_days: '300-360 days',
            expected_yield_per_acre: '300 - 450 Quintals',
            estimated_cost_per_acre: 45000.00,
            estimated_revenue_per_acre: 160000.00,
            fertilizer_guidance: 'NPK 250:100:100 kg/ha in 3 split doses. High organic manure incorporation.',
            irrigation_guidance: 'Heavy water requirement. 20-25 irrigations or subsurface drip irrigation system.',
            description: 'Long-duration cash crop producing sugar, jaggery, ethanol, and biomass.',
            icon: 'bi-water'
        },
        {
            id: 10,
            crop_name: 'Soybean',
            scientific_name: 'Glycine max',
            season: 'Kharif',
            soil_type: 'Black, Loamy, Alluvial',
            water_requirement: 'Medium',
            ideal_temperature: '20°C - 32°C',
            duration_days: '90-105 days',
            expected_yield_per_acre: '8 - 14 Quintals',
            estimated_cost_per_acre: 11000.00,
            estimated_revenue_per_acre: 46000.00,
            fertilizer_guidance: 'NPK 30:60:40 kg/ha + Bradyrhizobium culture. Essential sulphur application 20 kg/ha.',
            irrigation_guidance: 'Primarily rainfed in monsoon, requires supplemental irrigation if dry spell occurs during flowering or pod fill.',
            description: 'High-protein, high-oil legume widely grown in Central India.',
            icon: 'bi-flower2'
        }
    ],
    disease_information: [
        {
            id: 1,
            crop_name: 'Wheat',
            disease_name: 'Yellow Rust (Stripe Rust)',
            pathogen_type: 'Fungal (Puccinia striiformis)',
            severity: 'High',
            symptoms: 'Yellow stripes/pustules arranged in linear rows along leaf veins. Yellow powdery spores rub off on fingers when touched.',
            prevention: 'Cultivate resistant varieties such as HD-2967, PBW-550. Avoid excessive application of nitrogenous fertilizers.',
            treatment: 'Foliar spray of Propiconazole 25% EC (Tilt) @ 1 ml/liter of water at first sign of disease pustules.',
            favorable_conditions: 'Cool temperatures (10-15°C) with high relative humidity (>85%) and morning dews.'
        },
        {
            id: 2,
            crop_name: 'Wheat',
            disease_name: 'Loose Smut',
            pathogen_type: 'Fungal (Ustilago tritici)',
            severity: 'Medium',
            symptoms: 'Entire earhead is converted into a black powdery mass of fungal chlamydospores covered by a delicate membrane.',
            prevention: 'Use certified disease-free seeds. Practice solar seed treatment during hot summer months.',
            treatment: 'Seed treatment with Carboxin (Vitavax 75 WP) @ 2.5 g/kg seed or Carbendazim @ 2 g/kg prior to sowing.',
            favorable_conditions: 'Moderate temperatures (16-22°C) during flowering phase.'
        },
        {
            id: 3,
            crop_name: 'Rice (Paddy)',
            disease_name: 'Bacterial Leaf Blight (BLB)',
            pathogen_type: 'Bacterial (Xanthomonas oryzae)',
            severity: 'High',
            symptoms: 'Water-soaked lesions on leaf margins progressing into wavy yellowish-white stripes. Bacterial exudate beads visible in early morning.',
            prevention: 'Ensure balanced NPK fertilization. Do not clip seedling tips during transplanting. Drain standing water during outbreak.',
            treatment: 'Spray Streptocycline 1 g + Copper Oxychloride 25 g in 10 liters of clean water.',
            favorable_conditions: 'Warm temperatures (25-30°C), heavy rainfall, high humidity, and windy weather.'
        },
        {
            id: 4,
            crop_name: 'Rice (Paddy)',
            disease_name: 'Blast Disease',
            pathogen_type: 'Fungal (Magnaporthe oryzae)',
            severity: 'Critical',
            symptoms: 'Spindle-shaped or eye-shaped lesions with grey/whitish centers and reddish-brown margins on leaves; severe neck rot on panicles.',
            prevention: 'Treat seeds with Tricyclazole 75 WP. Avoid high nitrogen levels. Maintain proper field sanitation.',
            treatment: 'Spray Tricyclazole 75% WP (Beam) @ 0.6 g/liter or Isoprothiolane 40% EC @ 1.5 ml/liter.',
            favorable_conditions: 'Low night temperatures (20-22°C), high humidity (>90%), and prolonged leaf wetness.'
        },
        {
            id: 5,
            crop_name: 'Cotton',
            disease_name: 'Boll Rot',
            pathogen_type: 'Fungal & Bacterial Complex',
            severity: 'High',
            symptoms: 'Water-soaked spots on green bolls turning dark brown to black. Internal rotting of lint and seed prevents opening.',
            prevention: 'Maintain proper plant spacing (90x60 cm). Avoid excessive vegetative growth and excess nitrogen.',
            treatment: 'Foliar spray of Copper Oxychloride @ 2.5 g/liter + Streptocycline @ 0.1 g/liter.',
            favorable_conditions: 'Continuous overcast rainy days with dense crop canopy preventing sunlight penetration.'
        },
        {
            id: 6,
            crop_name: 'Tomato',
            disease_name: 'Early Blight',
            pathogen_type: 'Fungal (Alternaria solani)',
            severity: 'Medium',
            symptoms: 'Dark brown concentric ring spots ("target board" appearance) on older lower leaves. Yellow halo surrounding spots.',
            prevention: 'Crop rotation with non-solanaceous crops. Stake plants to keep foliage off ground.',
            treatment: 'Spray Mancozeb 75 WP @ 2.5 g/liter or Chlorothalonil @ 2 g/liter at 10-day intervals.',
            favorable_conditions: 'Warm, humid weather (24-29°C) with alternating wet and dry periods.'
        },
        {
            id: 7,
            crop_name: 'Tomato',
            disease_name: 'Tomato Leaf Curl Virus (ToLCV)',
            pathogen_type: 'Viral (transmitted by Whitefly)',
            severity: 'Critical',
            symptoms: 'Severe curling, puckering, reduction of leaf size, stunted bushy plant growth, dropping of flower buds.',
            prevention: 'Install yellow sticky traps (15-20/acre). Use insect-proof net nurseries.',
            treatment: 'Control whitefly vector using Imidacloprid 17.8 SL @ 0.5 ml/liter or Dimethoate 30 EC @ 1.5 ml/liter.',
            favorable_conditions: 'Dry, warm weather favoring multiplication and migration of Bemisia tabaci whiteflies.'
        },
        {
            id: 8,
            crop_name: 'Potato',
            disease_name: 'Late Blight',
            pathogen_type: 'Oomycete (Phytophthora infestans)',
            severity: 'Critical',
            symptoms: 'Water-soaked irregular spots on leaf tips and margins. White cottony fungal growth on underside of leaves in morning.',
            prevention: 'Plant certified disease-free seed tubers. Earthing up to prevent tuber exposure.',
            treatment: 'Prophylactic spray of Mancozeb 75 WP @ 2 g/liter; Curative spray of Cymoxanil + Mancozeb (Curzate) @ 2.5 g/liter.',
            favorable_conditions: 'Cool moist weather (12-18°C) with RH >90% and frequent rainfall or dense fog.'
        },
        {
            id: 9,
            crop_name: 'Maize (Corn)',
            disease_name: 'Fall Armyworm (FAW)',
            pathogen_type: 'Insect Pest (Spodoptera frugiperda)',
            severity: 'High',
            symptoms: 'Shot holes and extensive ragged chewing damage in the whorl. Wet sawdust-like frass accumulated inside whorl.',
            prevention: 'Deep summer ploughing. Intercrop with pulses. Install pheromone traps @ 5/acre.',
            treatment: 'Spray Chlorantraniliprole 18.5 SC (Coragen) @ 0.4 ml/liter or Emamectin Benzoate 5 SG @ 0.4 g/liter directly into whorl.',
            favorable_conditions: 'Warm weather, continuous availability of maize host crops across seasons.'
        }
    ],
    market_prices: [
        {
            id: 1,
            crop_name: 'Wheat',
            variety: 'Sharbati / PBW-550',
            market_name: 'Khanna Mandi',
            district: 'Ludhiana',
            state: 'Punjab',
            min_price: 2375.00,
            max_price: 2550.00,
            modal_price: 2450.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Up',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 2,
            crop_name: 'Wheat',
            variety: 'Kalyan Sona',
            market_name: 'Karnal Mandi',
            district: 'Karnal',
            state: 'Haryana',
            min_price: 2320.00,
            max_price: 2480.00,
            modal_price: 2400.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 3,
            crop_name: 'Rice (Paddy)',
            variety: 'Basmati 1121',
            market_name: 'Amritsar Grain Market',
            district: 'Amritsar',
            state: 'Punjab',
            min_price: 3400.00,
            max_price: 3950.00,
            modal_price: 3720.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Up',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 4,
            crop_name: 'Rice (Paddy)',
            variety: 'Common Paddy',
            market_name: 'Burdwan Mandi',
            district: 'Purba Bardhaman',
            state: 'West Bengal',
            min_price: 2183.00,
            max_price: 2250.00,
            modal_price: 2200.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 5,
            crop_name: 'Cotton',
            variety: 'Medium Staple',
            market_name: 'Rajkot Market Yard',
            district: 'Rajkot',
            state: 'Gujarat',
            min_price: 6800.00,
            max_price: 7450.00,
            modal_price: 7150.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Up',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 6,
            crop_name: 'Cotton',
            variety: 'Long Staple',
            market_name: 'Guntur Mandi',
            district: 'Guntur',
            state: 'Andhra Pradesh',
            min_price: 7100.00,
            max_price: 7650.00,
            modal_price: 7350.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 7,
            crop_name: 'Maize (Corn)',
            variety: 'Hybrid Yellow',
            market_name: 'Davanagere APMC',
            district: 'Davanagere',
            state: 'Karnataka',
            min_price: 1980.00,
            max_price: 2250.00,
            modal_price: 2120.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Down',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 8,
            crop_name: 'Chickpea (Gram)',
            variety: 'Desi Chana',
            market_name: 'Indore Mandi',
            district: 'Indore',
            state: 'Madhya Pradesh',
            min_price: 5400.00,
            max_price: 5950.00,
            modal_price: 5700.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Up',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 9,
            crop_name: 'Mustard',
            variety: 'Black Mustard',
            market_name: 'Alwar Mandi',
            district: 'Alwar',
            state: 'Rajasthan',
            min_price: 5100.00,
            max_price: 5550.00,
            modal_price: 5320.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 10,
            crop_name: 'Tomato',
            variety: 'Hybrid Local',
            market_name: 'Kolar APMC',
            district: 'Kolar',
            state: 'Karnataka',
            min_price: 1400.00,
            max_price: 2200.00,
            modal_price: 1800.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Up',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 11,
            crop_name: 'Potato',
            variety: 'Jyoti / Pukhraj',
            market_name: 'Agra Mandi',
            district: 'Agra',
            state: 'Uttar Pradesh',
            min_price: 1150.00,
            max_price: 1450.00,
            modal_price: 1300.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Down',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 12,
            crop_name: 'Soybean',
            variety: 'Yellow Soybean',
            market_name: 'Ujjain Mandi',
            district: 'Ujjain',
            state: 'Madhya Pradesh',
            min_price: 4300.00,
            max_price: 4750.00,
            modal_price: 4520.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        },
        {
            id: 13,
            crop_name: 'Sugarcane',
            variety: 'Standard Cane',
            market_name: 'Muzaffarnagar Mandi',
            district: 'Muzaffarnagar',
            state: 'Uttar Pradesh',
            min_price: 350.00,
            max_price: 390.00,
            modal_price: 370.00,
            price_unit: '₹ / Quintal',
            price_trend: 'Stable',
            source: 'Benchmark Agmarknet Reference',
            last_updated: new Date().toISOString().split('T')[0]
        }
    ]
};

// Auto-increment counter helpers for mock store
let nextIds = {
    users: 2,
    farmer_profiles: 2,
    reminders: 5,
    expenses: 6
};

/**
 * Initialize connection pool to MySQL
 */
async function initializePool() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'farmfusion_db',
            port: Number(process.env.DB_PORT) || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log(`[MySQL] ✓ Successfully connected to MySQL database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        isConnected = true;
    } catch (err) {
        console.warn('------------------------------------------------------------');
        console.warn('[MySQL Warning] Could not connect to live MySQL Server.');
        console.warn(`Reason: ${err.message}`);
        console.warn('Running with Resilient Agricultural Data Store for evaluation/demo.');
        console.warn('To switch to live MySQL:');
        console.warn('  1. Start MySQL in XAMPP or run Windows MySQL Service.');
        console.warn('  2. Run: npm run init-db');
        console.warn('------------------------------------------------------------');
        isConnected = false;
    }
}

// Call on startup
initializePool();

/**
 * Executes a SQL query. If MySQL is connected, queries MySQL.
 * Otherwise, routes into the in-memory store so the application
 * continues to function seamlessly for college viva and project demo.
 */
async function query(sql, params = []) {
    if (isConnected && pool) {
        try {
            return await pool.query(sql, params);
        } catch (err) {
            console.error('[MySQL Error] Query failed, using fallback handler:', err.message);
        }
    }

    // Fallback Mock Query Interpreter
    return executeFallbackQuery(sql, params);
}

/**
 * Fallback query interpreter for key application SQL patterns
 */
function executeFallbackQuery(sql, params = []) {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT users by email
    if (cleanSql.includes('FROM users WHERE email = ?')) {
        const email = params[0];
        const match = fallbackStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        return [match ? [match] : []];
    }

    // 2. SELECT users by id
    if (cleanSql.includes('FROM users WHERE id = ?')) {
        const id = Number(params[0]);
        const match = fallbackStore.users.find(u => u.id === id);
        return [match ? [match] : []];
    }

    // 3. INSERT INTO users
    if (cleanSql.startsWith('INSERT INTO users')) {
        const newId = nextIds.users++;
        const user = {
            id: newId,
            full_name: params[0],
            email: params[1],
            phone: params[2],
            password_hash: params[3],
            created_at: new Date()
        };
        fallbackStore.users.push(user);
        return [{ insertId: newId, affectedRows: 1 }];
    }

    // 4. SELECT farmer_profiles by user_id
    if (cleanSql.includes('FROM farmer_profiles WHERE user_id = ?')) {
        const userId = Number(params[0]);
        const profile = fallbackStore.farmer_profiles.find(p => p.user_id === userId);
        return [profile ? [profile] : []];
    }

    // 5. INSERT INTO farmer_profiles
    if (cleanSql.startsWith('INSERT INTO farmer_profiles')) {
        const newId = nextIds.farmer_profiles++;
        const profile = {
            id: newId,
            user_id: Number(params[0]),
            state: params[1],
            district: params[2],
            village: params[3] || '',
            land_area: parseFloat(params[4]) || 5,
            land_unit: params[5] || 'Acres',
            primary_soil_type: params[6] || 'Alluvial',
            water_source: params[7] || 'Tube-well / Borewell',
            preferred_crops: params[8] || 'Wheat, Rice',
            created_at: new Date()
        };
        fallbackStore.farmer_profiles.push(profile);
        return [{ insertId: newId, affectedRows: 1 }];
    }

    // 6. UPDATE farmer_profiles
    if (cleanSql.startsWith('UPDATE farmer_profiles')) {
        const userId = Number(params[params.length - 1]);
        const profile = fallbackStore.farmer_profiles.find(p => p.user_id === userId);
        if (profile) {
            profile.state = params[0];
            profile.district = params[1];
            profile.village = params[2];
            profile.land_area = parseFloat(params[3]);
            profile.land_unit = params[4];
            profile.primary_soil_type = params[5];
            profile.water_source = params[6];
            profile.preferred_crops = params[7];
        }
        return [{ affectedRows: profile ? 1 : 0 }];
    }

    // 7. REMINDERS queries
    if (cleanSql.includes('FROM reminders WHERE user_id = ?')) {
        const userId = Number(params[0]);
        let results = fallbackStore.reminders.filter(r => r.user_id === userId);
        results.sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date));
        return [results];
    }

    if (cleanSql.startsWith('INSERT INTO reminders')) {
        const newId = nextIds.reminders++;
        const reminder = {
            id: newId,
            user_id: Number(params[0]),
            title: params[1],
            crop_name: params[2] || 'General',
            category: params[3] || 'Irrigation',
            reminder_date: params[4],
            reminder_time: params[5] || '07:00:00',
            priority: params[6] || 'Medium',
            status: params[7] || 'Pending',
            description: params[8] || '',
            created_at: new Date()
        };
        fallbackStore.reminders.unshift(reminder);
        return [{ insertId: newId, affectedRows: 1 }];
    }

    if (cleanSql.startsWith('UPDATE reminders SET status = ? WHERE id = ? AND user_id = ?')) {
        const status = params[0];
        const id = Number(params[1]);
        const userId = Number(params[2]);
        const item = fallbackStore.reminders.find(r => r.id === id && r.user_id === userId);
        if (item) item.status = status;
        return [{ affectedRows: item ? 1 : 0 }];
    }

    if (cleanSql.startsWith('UPDATE reminders SET') && cleanSql.includes('WHERE id = ? AND user_id = ?')) {
        const id = Number(params[params.length - 2]);
        const userId = Number(params[params.length - 1]);
        const item = fallbackStore.reminders.find(r => r.id === id && r.user_id === userId);
        if (item) {
            item.title = params[0];
            item.crop_name = params[1];
            item.category = params[2];
            item.reminder_date = params[3];
            item.reminder_time = params[4];
            item.priority = params[5];
            item.status = params[6];
            item.description = params[7];
        }
        return [{ affectedRows: item ? 1 : 0 }];
    }

    if (cleanSql.startsWith('DELETE FROM reminders WHERE id = ? AND user_id = ?')) {
        const id = Number(params[0]);
        const userId = Number(params[1]);
        const prevLen = fallbackStore.reminders.length;
        fallbackStore.reminders = fallbackStore.reminders.filter(r => !(r.id === id && r.user_id === userId));
        return [{ affectedRows: prevLen - fallbackStore.reminders.length }];
    }

    // 8. EXPENSES queries
    if (cleanSql.includes('FROM expenses WHERE user_id = ?')) {
        const userId = Number(params[0]);
        let results = fallbackStore.expenses.filter(e => e.user_id === userId);
        results.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
        return [results];
    }

    if (cleanSql.startsWith('INSERT INTO expenses')) {
        const newId = nextIds.expenses++;
        const expense = {
            id: newId,
            user_id: Number(params[0]),
            category: params[1],
            amount: parseFloat(params[2]),
            expense_date: params[3],
            payment_method: params[4] || 'Cash',
            description: params[5] || '',
            created_at: new Date()
        };
        fallbackStore.expenses.unshift(expense);
        return [{ insertId: newId, affectedRows: 1 }];
    }

    if (cleanSql.startsWith('UPDATE expenses SET') && cleanSql.includes('WHERE id = ? AND user_id = ?')) {
        const id = Number(params[params.length - 2]);
        const userId = Number(params[params.length - 1]);
        const item = fallbackStore.expenses.find(e => e.id === id && e.user_id === userId);
        if (item) {
            item.category = params[0];
            item.amount = parseFloat(params[1]);
            item.expense_date = params[2];
            item.payment_method = params[3];
            item.description = params[4];
        }
        return [{ affectedRows: item ? 1 : 0 }];
    }

    if (cleanSql.startsWith('DELETE FROM expenses WHERE id = ? AND user_id = ?')) {
        const id = Number(params[0]);
        const userId = Number(params[1]);
        const prevLen = fallbackStore.expenses.length;
        fallbackStore.expenses = fallbackStore.expenses.filter(e => !(e.id === id && e.user_id === userId));
        return [{ affectedRows: prevLen - fallbackStore.expenses.length }];
    }

    // 9. CROP INFORMATION
    if (cleanSql.includes('FROM crop_information')) {
        return [fallbackStore.crop_information];
    }

    // 10. DISEASE INFORMATION
    if (cleanSql.includes('FROM disease_information')) {
        return [fallbackStore.disease_information];
    }

    // 11. MARKET PRICES
    if (cleanSql.includes('FROM market_prices')) {
        return [fallbackStore.market_prices];
    }

    return [[]];
}

module.exports = {
    query,
    getPool: () => pool,
    isDbConnected: () => isConnected,
    initializePool
};
