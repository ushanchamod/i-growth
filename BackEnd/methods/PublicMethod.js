import pool from "../resource/db_connection.js";
import path from 'path';

export const GetAllAreas = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM area');
        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetAreaByID = async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try {
        const [rows] = await pool.query('SELECT * FROM area WHERE area_id = ? LIMIT 1', [id]);
        if (rows.length > 0) {
            const data = rows[0]
            return res.status(200).send(data)
        }
        else {
            return res.status(404).json({
                message: 'Area not found'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetSession = async (req, res, next) => {
    const session = req.session;

    if (session) {
        return res.status(200).json({
            session: session
        })
    }
    else {
        return res.status(404).json({
            message: 'Session not found'
        })
    }
}

export const GetImageByID = async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }

    const current_directory = path.resolve();
    const image_path = path.join(current_directory, 'uploads', id);
    res.sendFile(image_path);
}

export const GetNews = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM news_feed order by date desc');
        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetNewsByID = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM news_feed WHERE news_id = ? LIMIT 1', [id]);
        return res.status(200).json(rows[0])
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}
