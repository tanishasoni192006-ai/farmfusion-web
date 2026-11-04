/**
 * Farmer Profile Controller
 * Manages agricultural farm attributes (land area, soil, water source, location)
 */
const db = require('../config/db');

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const [users] = await db.query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [userId]);
        const [profiles] = await db.query('SELECT * FROM farmer_profiles WHERE user_id = ?', [userId]);

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'Farmer account not found.' });
        }

        res.status(200).json({
            success: true,
            user: users[0],
            profile: profiles[0] || null
        });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const {
            full_name,
            phone,
            state,
            district,
            village,
            land_area,
            land_unit,
            primary_soil_type,
            water_source,
            preferred_crops
        } = req.body;

        // Update user name/phone if provided
        if (full_name || phone) {
            await db.query(
                'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?',
                [full_name ? full_name.trim() : null, phone ? phone.trim() : null, userId]
            );
            if (full_name) {
                req.session.user.full_name = full_name.trim();
            }
        }

        // Update or insert profile
        const [existing] = await db.query('SELECT id FROM farmer_profiles WHERE user_id = ?', [userId]);
        if (existing && existing.length > 0) {
            await db.query(
                `UPDATE farmer_profiles SET 
                state = ?, district = ?, village = ?, land_area = ?, land_unit = ?, 
                primary_soil_type = ?, water_source = ?, preferred_crops = ?
                WHERE user_id = ?`,
                [
                    state || 'Punjab',
                    district || 'Ludhiana',
                    village || '',
                    parseFloat(land_area) || 5.0,
                    land_unit || 'Acres',
                    primary_soil_type || 'Alluvial',
                    water_source || 'Tube-well / Borewell',
                    preferred_crops || 'Wheat, Rice',
                    userId
                ]
            );
        } else {
            await db.query(
                `INSERT INTO farmer_profiles 
                (user_id, state, district, village, land_area, land_unit, primary_soil_type, water_source, preferred_crops)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    state || 'Punjab',
                    district || 'Ludhiana',
                    village || '',
                    parseFloat(land_area) || 5.0,
                    land_unit || 'Acres',
                    primary_soil_type || 'Alluvial',
                    water_source || 'Tube-well / Borewell',
                    preferred_crops || 'Wheat, Rice'
                ]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Farmer profile updated successfully.'
        });
    } catch (err) {
        next(err);
    }
};
