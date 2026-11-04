/**
 * Crop Advisory Controller
 * Implements rule-based agricultural crop guidance based on soil, season, water, and acreage.
 * Predefined agricultural database + algorithmic suitability scoring.
 */
const db = require('../config/db');

exports.getCropAdvice = async (req, res, next) => {
    try {
        const {
            soil_type = 'Alluvial',
            land_area = 5,
            season = 'Rabi',
            water_availability = 'Medium',
            state = 'Punjab'
        } = req.body;

        const parsedArea = parseFloat(land_area) || 1.0;

        // Fetch all crop profiles from database
        const [crops] = await db.query('SELECT * FROM crop_information');

        const recommendations = [];

        crops.forEach(crop => {
            let score = 50; // base score
            const matchReasons = [];
            const alerts = [];

            // 1. Season evaluation
            const seasons = crop.season.toLowerCase();
            const selectedSeason = season.toLowerCase();
            if (seasons.includes(selectedSeason) || seasons.includes('all-season')) {
                score += 25;
                matchReasons.push(`Naturally suited for the ${season} cropping calendar`);
            } else {
                score -= 30;
                alerts.push(`Off-season crop: Growing outside ${crop.season} requires climate control`);
            }

            // 2. Soil type evaluation
            const cropSoils = crop.soil_type.toLowerCase();
            const selectedSoil = soil_type.toLowerCase();
            if (cropSoils.includes(selectedSoil)) {
                score += 20;
                matchReasons.push(`Excellent root aeration and drainage in ${soil_type} soil`);
            } else if (cropSoils.includes('alluvial') || cropSoils.includes('loamy')) {
                score += 10;
                matchReasons.push(`Adaptable to ${soil_type} with adequate organic manure`);
            } else {
                score -= 10;
                alerts.push(`Sub-optimal soil texture: ${soil_type} may require special tillage`);
            }

            // 3. Water availability evaluation
            const cropWater = crop.water_requirement.toLowerCase();
            const selectedWater = water_availability.toLowerCase();

            if (selectedWater === cropWater) {
                score += 20;
                matchReasons.push(`Matches your ${water_availability} water capacity without deficit stress`);
            } else if (selectedWater === 'low' && cropWater === 'high') {
                score -= 35;
                alerts.push(`High water requirement poses risk under low water conditions unless drip irrigation is installed`);
            } else if (selectedWater === 'high' && cropWater === 'low') {
                score += 5;
                matchReasons.push(`Low moisture requirement reduces irrigation electricity and diesel expenditure`);
            } else {
                score += 10;
            }

            // Normalize score between 10 and 99
            const finalScore = Math.min(Math.max(score, 15), 98);

            // Compute financial and yield estimations based on land area
            const costPerAcre = parseFloat(crop.estimated_cost_per_acre) || 12000;
            const revenuePerAcre = parseFloat(crop.estimated_revenue_per_acre) || 45000;
            const totalEstimatedCost = costPerAcre * parsedArea;
            const totalEstimatedRevenue = revenuePerAcre * parsedArea;
            const estimatedNetProfit = totalEstimatedRevenue - totalEstimatedCost;

            let recommendationTier = 'Conditional';
            let badgeClass = 'bg-warning text-dark';
            if (finalScore >= 75) {
                recommendationTier = 'Highly Recommended';
                badgeClass = 'bg-success';
            } else if (finalScore >= 55) {
                recommendationTier = 'Recommended';
                badgeClass = 'bg-info text-dark';
            }

            recommendations.push({
                crop_id: crop.id,
                crop_name: crop.crop_name,
                scientific_name: crop.scientific_name,
                suitability_score: finalScore,
                recommendation_tier: recommendationTier,
                badgeClass,
                season: crop.season,
                soil_type: crop.soil_type,
                water_requirement: crop.water_requirement,
                duration_days: crop.duration_days,
                expected_yield_per_acre: crop.expected_yield_per_acre,
                fertilizer_guidance: crop.fertilizer_guidance,
                irrigation_guidance: crop.irrigation_guidance,
                description: crop.description,
                icon: crop.icon || 'bi-flower1',
                financials: {
                    landArea: parsedArea,
                    estimatedCost: Math.round(totalEstimatedCost),
                    estimatedRevenue: Math.round(totalEstimatedRevenue),
                    estimatedProfit: Math.round(estimatedNetProfit)
                },
                matchReasons,
                alerts
            });
        });

        // Sort descending by suitability score
        recommendations.sort((a, b) => b.suitability_score - a.suitability_score);

        res.status(200).json({
            success: true,
            parameters: {
                soil_type,
                land_area: parsedArea,
                season,
                water_availability,
                state
            },
            disclaimer: '⚠️ Academic Advisory Notice: These recommendations are rule-based computational suggestions generated for educational reference. Consult your local Krishi Vigyan Kendra (KVK) or official Soil Health Card for laboratory testing.',
            resultsCount: recommendations.length,
            recommendations
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllCrops = async (req, res, next) => {
    try {
        const [crops] = await db.query('SELECT * FROM crop_information ORDER BY crop_name ASC');
        res.status(200).json({
            success: true,
            crops
        });
    } catch (err) {
        next(err);
    }
};
