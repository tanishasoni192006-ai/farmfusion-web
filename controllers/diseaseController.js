/**
 * Crop Disease Knowledge Base Controller
 * Structured plant pathology information with organic, cultural, and chemical remedies.
 */
const db = require('../config/db');

exports.getDiseases = async (req, res, next) => {
    try {
        const { crop, search, severity } = req.query;

        let sql = 'SELECT * FROM disease_information WHERE 1=1';
        const params = [];

        if (crop && crop !== 'All') {
            sql += ' AND crop_name = ?';
            params.push(crop);
        }
        if (severity && severity !== 'All') {
            sql += ' AND severity = ?';
            params.push(severity);
        }
        if (search) {
            sql += ' AND (disease_name LIKE ? OR symptoms LIKE ? OR crop_name LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        sql += ' ORDER BY crop_name ASC, severity DESC';

        const [diseases] = await db.query(sql, params);

        res.status(200).json({
            success: true,
            count: diseases.length,
            notice: 'Plant Pathology Diagnostic Guide (Educational Resource - Rule-based information only)',
            diseases
        });
    } catch (err) {
        next(err);
    }
};

exports.getDiseaseById = async (req, res, next) => {
    try {
        const diseaseId = req.params.id;
        const [diseases] = await db.query('SELECT * FROM disease_information WHERE id = ?', [diseaseId]);

        if (!diseases || diseases.length === 0) {
            return res.status(404).json({ success: false, message: 'Disease entry not found.' });
        }

        res.status(200).json({
            success: true,
            disease: diseases[0]
        });
    } catch (err) {
        next(err);
    }
};
