/**
 * Market Information & Mandi Rates Controller
 * Provides agricultural market intelligence and transparent benchmark price data.
 */
const db = require('../config/db');

exports.getMarketPrices = async (req, res, next) => {
    try {
        const { crop, state, search } = req.query;

        let sql = 'SELECT * FROM market_prices WHERE 1=1';
        const params = [];

        if (crop && crop !== 'All') {
            sql += ' AND crop_name = ?';
            params.push(crop);
        }
        if (state && state !== 'All') {
            sql += ' AND state = ?';
            params.push(state);
        }
        if (search) {
            sql += ' AND (crop_name LIKE ? OR market_name LIKE ? OR district LIKE ? OR state LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        sql += ' ORDER BY crop_name ASC, modal_price DESC';

        const [records] = await db.query(sql, params);

        res.status(200).json({
            success: true,
            count: records.length,
            label: 'Benchmark Mandi Reference Rates (Structured Agmarknet standard reference for educational demo)',
            records
        });
    } catch (err) {
        next(err);
    }
};
