import pool from "../resource/db_connection.js";

export const OfficerLogin = async (req, res, next) => {
    const { nic, password } = req.body;
    if (!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try {
        const [rows] = await pool.query('SELECT officer_id, email, area_id, nic FROM medical_officer WHERE nic = ? AND password = ? LIMIT 1', [nic, password]);
        console.log(rows);
        try {
            if (rows.length > 0) {
                req.session.officer = { officer_id: rows[0], area_id: rows[0].area_id };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.officer.officer_id
                })
            }
            else {
                return res.status(401).json({
                    message: 'Login failed'
                })
            }
        }
        catch (err) {
            return res.status(500).json({
                message: err.message
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const Logout = async (req, res, next) => {
    req.session.destroy();
    return res.status(200).json({
        message: 'Logged out'
    })
}

export const AddNews = async (req, res, next) => {
    const { title, summary, description } = req.body;

    const author = `{"id":${req.session.officer.officer_id.officer_id},"role":"officer"}`

    const image = req.file.filename;

    if (!title || !summary || !description || !image || !author) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    try {
        const [rows] = await pool.query('INSERT INTO news_feed (title, summary, description, image, author) VALUES (?, ?, ?, ?, ?)', [title, summary, description, image, author]);
        if (rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'News added'
            })
        }
        else {
            return res.status(500).json({
                message: 'News adding failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetNews = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM news_feed');
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

export const DeleteNews = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('DELETE FROM news_feed WHERE news_id = ?', [id]);
        if (rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'News deleted'
            })
        }
        else {
            return res.status(500).json({
                message: 'News deleting failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetOfficerProfile = async (req, res, next) => {
    const officer_id = req.session.officer.officer_id.officer_id;

    try {
        let [rows] = await pool.query('SELECT medical_officer.*, area.area_name FROM medical_officer inner join area on medical_officer.area_id = area.area_id WHERE medical_officer.officer_id = ? LIMIT 1', [officer_id]);
        rows.forEach(row => {
            delete row.password;
        })
        return res.status(200).json(rows[0])
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const UpdateOfficerProfile = async (req, res, next) => {
    const officer_id = req.session.officer.officer_id.officer_id;
    const { name, phone, old_password, new_password } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }

    if (new_password.length > 0 || old_password.length > 0) {
        if (!new_password || !old_password) {
            return res.status(400).json({
                message: 'you need provide old_password and new_password'
            })
        }

        if (new_password.trim().length < 6) {
            return res.status(400).json({
                message: 'password must be at least 6 characters'
            })
        }

        try {
            const [rows] = await pool.query('SELECT password FROM medical_officer WHERE officer_id = ? LIMIT 1', [officer_id]);
            if (rows.length > 0) {
                if (rows[0].password !== old_password) {
                    return res.status(400).json({
                        message: 'Old password is incorrect'
                    })
                }
            }
            else {
                return res.status(400).json({
                    message: 'Old password is incorrect'
                })
            }

        }
        catch (err) {
            return res.status(500).json({
                message: err.message
            })
        }

        //  update data
        try {
            const [rows] = await pool.query('UPDATE medical_officer SET officer_name = ?, phone = ?, password = ? WHERE officer_id = ?', [name, phone, new_password, officer_id]);
            if (rows.affectedRows > 0) {
                return res.status(200).json({
                    message: 'Profile updated'
                })
            }
            else {
                return res.status(500).json({
                    message: 'Profile updating failed'
                })
            }
        }
        catch (err) {
            return res.status(500).json({
                message: err.message
            })
        }
    }
    else {
        // not update password
        try {
            const [rows] = await pool.query('UPDATE medical_officer SET officer_name = ?, phone = ? WHERE officer_id = ?', [name, phone, officer_id]);
            if (rows.affectedRows > 0) {
                return res.status(200).json({
                    message: 'Profile updated'
                })
            }
            else {
                return res.status(500).json({
                    message: 'Profile updating failed'
                })
            }
        }
        catch (err) {
            return res.status(500).json({
                message: err.message
            })
        }
    }


}

const cal_sd = (month) => {
    return {
        plus_3SD: -(0.0174718 * Math.pow(month, 2)) + (0.91498 * month) + 5.11339,
        plus_2SD: -(0.0157843 * Math.pow(month, 2)) + (0.803843 * month) + 4.53092,
        plus_1SD: -(0.0142931 * Math.pow(month, 2)) + (0.719308 * month) + 3.90559,
        median: -(0.013029 * Math.pow(month, 2)) + (0.645037 * month) + 3.46785,
        minus_1SD: -(0.0117718 * Math.pow(month, 2)) + (0.577913 * month) + 2.96326,
        minus_2SD: -(0.0107021 * Math.pow(month, 2)) + (0.523242 * month) + 2.55719,
        minus_3SD: -(0.00420753 * Math.pow(month, 2)) + (0.353832 * month) + 2.0324,
    }
}

export const GetSummary = async (req, res, next) => {
    const officer_id = req.session.officer.officer_id.officer_id;
    const { area_id } = req.session.officer.officer_id;

    let DATA = {
        child_in_60_month: undefined,
        total_parent: undefined,
        wight_group: {
            over_weight: 0,
            proper_weight: 0,
            risk_for_under_weight: 0,
            medium_under_weight: 0,
            severe_under_weight: 0
        },
    }

    try {
        // get all child 60 weeks
        const [rows] = await pool.query('SELECT COUNT(child_id) as total FROM child WHERE TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) <= 60 AND area_id = ?', [area_id]);
        DATA.child_in_60_month = rows[0].total;
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }


    // get total parent
    try {
        const [rows] = await pool.query('SELECT COUNT(guardian_nic) as total FROM parent WHERE area_id = ?', [area_id]);
        DATA.total_parent = rows[0].total;
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }



    // WEIGHT GROUP
    let child_in_one_month = [];
    try {
        const [rows] = await pool.query("SELECT gd.* FROM growth_detail gd INNER JOIN ( SELECT child_id, MAX(updated_date) AS latest_date FROM growth_detail GROUP BY child_id ) latest_growth ON gd.child_id = latest_growth.child_id AND gd.updated_date = latest_growth.latest_date INNER JOIN child c ON gd.child_id = c.child_id WHERE gd.updated_date >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND c.area_id = ?", [area_id]);
        child_in_one_month = rows;
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }

    // 
    child_in_one_month.map(child => {

        const SD_values = cal_sd(child.month)

        console.log({ wight: child.weight, SD_values });

        if (child.weight < SD_values.minus_3SD) {
            DATA.wight_group.severe_under_weight += 1;
        }
        else if (child.weight < SD_values.minus_2SD) {
            DATA.wight_group.medium_under_weight += 1;
        }
        else if (child.weight < SD_values.minus_1SD) {
            DATA.wight_group.risk_for_under_weight += 1;
        }
        else if (child.weight < SD_values.plus_2SD) {
            DATA.wight_group.proper_weight += 1;
        }
        else {
            DATA.wight_group.over_weight += 1;
        }

    })




    res.send(DATA);

}