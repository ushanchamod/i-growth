import pool from "../resource/db_connection.js";
import { transporter } from "../resource/email.js";
import GeneratePassword from "../resource/password_genarate.js";

export const MidwifeLogin = async (req, res, next) => {
    const { nic, password } = req.body;
    if (!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try {
        const [rows] = await pool.query('SELECT midwife_id, area_id, email, nic FROM midwife WHERE nic = ? AND password = ? LIMIT 1', [nic, password]);

        try {
            if (rows.length > 0) {
                req.session.midwife = { midwife_id: rows[0], area_id: rows[0].area_id };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.midwife.midwife_id
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

export const MidwifeLogout = async (req, res, next) => {
    try {
        req.session.destroy();
        return res.status(200).json({
            message: 'Logout success'
        })
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const CheckMidwifeAuth = async (req, res, next) => {
    if (req.session.midwife) {
        return res.status(200).json({
            message: 'Authorized'
        })
    }
    else {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
}

export const CreateParent = async (req, res, next) => {
    const { guardian_nic, mother_name, father_name, phone, email, address, area_id, guardian_name } = req.body;

    const password = GeneratePassword;

    if (!guardian_nic || !mother_name || !father_name || !phone || !email || !address || !area_id || !guardian_name) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ['guardian_nic', 'mother_name', 'father_name', 'phone', 'email', 'address', 'area_id', 'password', 'guardian_name']
        })
    }

    if (area_id != req.session.midwife.midwife_id.area_id) {
        return res.status(401).json({
            message: 'Not privileges'
        })
    }

    try {
        const [rows] = await pool.query('INSERT INTO parent (guardian_nic, mother_name, father_name, phone, email, address, area_id, password, guardian_name, created_midwife) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [guardian_nic.toLowerCase(), mother_name, father_name, phone, email, address, area_id, password, guardian_name, req.session.midwife.midwife_id.midwife_id]);

        if (rows.affectedRows > 0) {
            // send email
            try {
                await transporter.sendMail({
                    from: "I-GROWTH <uc.chamod.public@gmail.com>",
                    to: `${email}`,
                    subject: "Your account have been created",
                    html: `
                        <h1>Your account have been created</h1>
                        <p>Username: ${guardian_nic}</p>
                        <p>Password: ${password}</p>
                        <p>Click <a href="http://localhost:3000/parent/login">here</a> to login</p>
                    `
                });

                res.status(200).json({ message: 'Parent created' })
            }
            catch (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Can't send username and password to parent"
                })
            }
        }
        else {
            return res.status(500).json({
                message: 'Officer creation failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const getAllParents = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT parent.*, area.area_name FROM parent inner join area on parent.area_id = area.area_id where parent.area_id = ?', [req.session.midwife.midwife_id.area_id]);
        const parents = rows.map((row) => {
            const { password, ...parent } = row;
            return parent;
        })
        return res.status(200).json(parents)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const UpdateParent = async (req, res, next) => {
    const { guardian_nic } = req.params;
    const { mother_name, father_name, phone, address, guardian_name } = req.body;

    if (!guardian_nic || !mother_name || !father_name || !phone || !address || !guardian_name) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ['guardian_nic', 'mother_name', 'father_name', 'phone', 'address', 'guardian_name']
        })
    }

    // get parent by gardian_nic
    try {
        const [rows] = await pool.query('SELECT * FROM parent WHERE guardian_nic = ?', [guardian_nic.toLowerCase()]);

        if (rows.length < 1) return res.status(404).json({ message: 'Parent not found' })

        if (rows[0].area_id != req.session.midwife.midwife_id.area_id) {
            return res.status(401).json({
                message: 'Not privileges'
            })
        }

    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }


    try {
        const [row] = await pool.query('UPDATE parent SET mother_name = ?, father_name = ?, phone = ?, address = ?, guardian_name = ? WHERE guardian_nic = ?', [mother_name, father_name, phone, address, guardian_name, guardian_nic.toLowerCase()]);

        if (row.affectedRows > 0) {
            return res.status(200).json({
                message: 'Parent updated'
            })
        }
        else {
            return res.status(500).json({
                message: 'Parent updating failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetParentByID = async (req, res, next) => {
    const { guardian_nic } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM parent WHERE guardian_nic = ?', [guardian_nic]);
        if (rows.length < 1) return res.status(404).json({ message: 'Parent not found' })
        const { password, ...rest } = rows[0];
        return res.status(200).json(rest)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const AddChild = async (req, res, next) => {
    const { child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic } = req.body;

    if (!child_name || !child_gender || !child_birthday || !child_birth_certificate_no || !child_born_weight || !gardian_nic) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ["child_name", "child_gender", "child_birthday", "child_birth_certificate_no", "child_born_weight", "gardian_nic"]
        })
    }

    try {
        const [rows] = await pool.query('INSERT INTO child (child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic.toLowerCase(), req.session.midwife.midwife_id.area_id]);

        if (rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Child added'
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

export const GetChildByID = async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT child.*, parent.guardian_nic, parent.mother_name, parent.father_name, parent.phone, parent.email, parent.address, parent.area_id, area.area_name, parent.guardian_name, parent.created_midwife FROM child join parent on child.gardian_nic = parent.guardian_nic join area on child.area_id = area.area_id where child.child_id = ?', [id]);

        if (rows.length < 1) return res.status(404).json({ message: 'Child not found' })

        return res.status(200).json(rows[0])
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetAllChild = async (req, res, next) => {

    try {
        const [rows] = await pool.query('SELECT child.*, parent.guardian_nic, parent.mother_name, parent.father_name, parent.phone, parent.email, parent.address, parent.area_id, area.area_name, parent.guardian_name, parent.created_midwife FROM child inner join parent on child.gardian_nic = parent.guardian_nic inner join area on child.area_id = area.area_id where child.area_id = ?', [req.session.midwife.midwife_id.area_id]);

        if (rows.length < 1) return res.status(404).json({ message: 'Child not found' })

        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const UpdateChild = async (req, res, next) => {
    const { child_id } = req.params;
    const { child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight } = req.body;

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    if (!child_name || !child_gender || !child_birthday || !child_born_weight) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ["child_name", "child_gender", "child_birthday", "child_born_weight"]
        })
    }

    try {
        const [row] = await pool.query('UPDATE child SET child_name = ?, child_gender = ?, child_birthday = ?, child_born_weight = ?', [child_name, child_gender, child_birthday, child_born_weight]);

        if (row.affectedRows > 0) {
            return res.status(200).json({
                message: 'Child updated'
            })
        }
        else {
            return res.status(500).json({
                message: 'Child updating failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const AddChildGrowthDetail = async (req, res, next) => {
    const { child_id } = req.params;

    const { weight, height, month, head_cricumference } = req.body;

    if (!weight || !height || !month || !head_cricumference) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ["weight", "height", "month", "head_cricumference"],
        })
    }

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    const bmi = (parseFloat(weight) / (parseFloat(height / 100) * parseFloat(height / 100))).toFixed(3);

    try {
        const [rows] = await pool.query('INSERT INTO growth_detail (child_id, weight, height, month, head_cricumference, bmi) VALUES (?, ?, ?, ?, ?, ?)', [child_id, weight, height, month, head_cricumference, bmi]);

        if (rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Child growth detail added'
            })
        }
        else {
            return res.status(500).json({
                message: 'Child growth detail adding failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetChildGrowthDetailByID = async (req, res, next) => {
    const { child_id } = req.params;

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ?', [child_id]);

        if (rows.length < 1) return res.status(404).json({ message: 'Child growth detail not found' })

        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const GetLastChildGrowthDetail = async (req, res, next) => {
    const { child_id } = req.params;

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT growth_detail.*, child.child_name, child.area_id as area_id , TIMESTAMPDIFF(MONTH, child.child_birthday, CURDATE()) AS months_difference FROM growth_detail join child on child.child_id = growth_detail.child_id WHERE growth_detail.child_id = ? ORDER BY month DESC LIMIT 1', [child_id]);
        
        if (rows.length < 1) {
            try {
                const [child] = await pool.query('SELECT *, TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) AS months_difference FROM child WHERE child_id = ?', [child_id]);
                if (child.length < 1) return res.status(404).json({ message: 'Child not found' })
                return res.status(200).json({
                    message: 'Child growth detail not found',
                    child: child[0]
                })
            }
            catch (err) {
                return res.status(500).json({
                    message: err.message
                })
            }
            // return res.status(404).json({message: 'Child growth detail not found'})
        }

        console.log(req.session.midwife.midwife_id.area_id, rows[0].area_id);
        if (req.session.midwife.midwife_id.area_id != rows[0].area_id) {
            return res.status(200).json({
                message: 'Not privileges'
            })
        }

        console.log(rows[0]);
        return res.status(200).json(rows[0])
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
    }
}

export const LastGrowthData = async (req, res, next) => {
    const { child_id } = req.params;

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ? ORDER BY month DESC LIMIT 1', [child_id]);
        if(rows.length < 1) return res.status(200).send([])
        return res.status(200).json(rows[0])
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
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

export const GetSDMeasurements = async (req, res, next) => {

    const { area_id } = req.session.midwife.midwife_id;

    try {
        const [rows] = await pool.query('SELECT child.*, TIMESTAMPDIFF(MONTH, child.child_birthday, CURDATE()) AS months_difference, growth_detail.weight FROM child LEFT JOIN growth_detail ON child.child_id = growth_detail.child_id AND growth_detail.month = ( SELECT MAX(month) FROM growth_detail WHERE child_id = child.child_id ) WHERE child.child_birthday >= DATE_SUB(CURDATE(), INTERVAL 60 MONTH) AND child.area_id = ?', [area_id]);

        // Create object for save 60 arrays
        var sixtyMonths = {};
        var sixtyMonths_copy = {};

        // Create 60 arrays
        for (var i = 1; i <= 60; i++) {
            sixtyMonths[i] = [];
            sixtyMonths_copy[i] = [];
        }

        // Add data to arrays
        rows.forEach(row => {
            if (row.months_difference >= 1 && row.months_difference <= 60) sixtyMonths[row.months_difference].push(row);
            // console.log(row.months_difference);
        })

        console.log(sixtyMonths);

        // Calculate SD
        Object.keys(sixtyMonths).map((key) => {

            if (sixtyMonths[key].length > 0) {
                sixtyMonths[key].forEach((row) => {

                    let caled_sd = cal_sd(row.months_difference);

                    if (row.weight > caled_sd.plus_2SD) {
                        sixtyMonths_copy[key].push({
                            // ...row,
                            sd: 'over_weight'
                        })
                    }
                    else if (row.weight > caled_sd.minus_1SD) {
                        sixtyMonths_copy[key].push({
                            // ...row,
                            sd: 'proper_weight'
                        })
                    }
                    else if (row.weight > caled_sd.minus_2SD) {
                        sixtyMonths_copy[key].push({
                            // ...row,
                            sd: 'risk_of_under_weight'
                        })
                    }
                    else if (row.weight > caled_sd.minus_3SD) {
                        sixtyMonths_copy[key].push({
                            // ...row,
                            sd: 'minimum_under_weight'
                        })
                    }
                    else {
                        sixtyMonths_copy[key].push({
                            // ...row,
                            sd: 'severe_under_weight'
                        })
                    }
                })
            }
        })



        Object.keys(sixtyMonths_copy).map((key) => {

            if (sixtyMonths_copy[key].length > 0) {
                sixtyMonths_copy[key].forEach((row) => {
                    let sd_count = {
                        over_weight: 0,
                        proper_weight: 0,
                        risk_of_under_weight: 0,
                        minimum_under_weight: 0,
                        severe_under_weight: 0,
                    }

                    if (row.sd == 'over_weight') sd_count.over_weight++;
                    else if (row.sd == 'proper_weight') sd_count.proper_weight++;
                    else if (row.sd == 'risk_of_under_weight') sd_count.risk_of_under_weight++;
                    else if (row.sd == 'minimum_under_weight') sd_count.minimum_under_weight++;
                    else if (row.sd == 'severe_under_weight') sd_count.severe_under_weight++;

                    sixtyMonths_copy[key] = sd_count
                });

            }
            else {
                sixtyMonths_copy[key] = {
                    over_weight: 0,
                    proper_weight: 0,
                    risk_of_under_weight: 0,
                    minimum_under_weight: 0,
                    severe_under_weight: 0,
                }
            }
        })
        // console.log(sixtyMonths_copy);
        res.send(sixtyMonths_copy)
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetAllVaccine = async (req, res, next) => {
    const midwife_area_id = req.session.midwife.midwife_id.area_id;

    try {
        const [rows] = await pool.query('SELECT vaccine_timetable.vaccine_timetable_id as id, vaccine_timetable.vaccine_month, vaccine_timetable.note, vaccine.vaccine_name FROM vaccine_timetable inner join vaccine on vaccine_timetable.vaccine_id = vaccine.vaccine_id');

        // const vaccines_populate_with_more_data = rows.map( async(row) => {
        //     const {vaccine_id, vaccine_name, note} = row;

        //     // Get how many children are eligible for this vaccine
        //     const [children] = await pool.query(`select COUNT(child_id), TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) AS months_difference from child where area_id = ?`, [midwife_area_id]);
        //     console.log(children);
        // })

        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetVaccineTableForChild = async (req, res, next) => {
    const { child_id } = req.params;

    // var VACCINE_MAP = []

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        let [all_vaccine] = await pool.query(`select vaccine_timetable.*, vaccine.* from vaccine_timetable join vaccine on vaccine.vaccine_id = vaccine_timetable.vaccine_id`);

        if (all_vaccine.length < 1) return res.status(404).json({ message: 'Vaccine not found' })

        const [children] = await pool.query(`select *, TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) AS months_difference from child where child_id = ?`, [child_id]);

        if (children.length < 1) return res.status(404).json({ message: 'Child not found' })

        const child = children[0];

        const [vaccine_time_table] = await pool.query(`select vaccine_timetable.*, vaccine.* from vaccine_timetable join vaccine on vaccine.vaccine_id = vaccine_timetable.vaccine_id order by vaccine_month ASC`);


        // let return_data = {
        //     vaccine_id: vaccine.vaccine_id,
        //     vaccine_name: vaccine.vaccine_name,
        //     vaccine_month: vaccine.vaccine_month,
        // }

        const VACCINE_MAP = await Promise.all( 
            vaccine_time_table.map(async(vaccine) => {
                let {vaccine_timetable_id} = vaccine;
                let {child_id} = child;
                let {months_difference} = child;

                let return_data = {
                    time_table_id: vaccine_timetable_id,
                    vaccine_id: vaccine.vaccine_id,
                    vaccine_name: vaccine.vaccine_name,
                    vaccine_month: vaccine.vaccine_month,
                }

            try{
                // check vaccine taken or not
                const [result] = await pool.query('select * from taked_vaccine where time_table_id = ? and child_id = ?', [vaccine_timetable_id, child_id]);
                
                if(result.length > 0){
                    return_data = {...return_data, status: "taken"}
                }
                else{
                    if(vaccine.vaccine_month <= months_difference){
                        return_data = {...return_data, status: "eligible"}
                    }
                    else{
                        return_data = {...return_data, status: "not_eligible"}
                    }
                }

                

            }
                catch(err){
                console.log(err);
                return res.status(500).json({
                    message: err.message
                })
                }

                // console.log(return_data);
                return return_data
            })
        )


        console.log(VACCINE_MAP);
        return res.status(200).json(VACCINE_MAP)

    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const VaccineGetByChild = async (req, res, next) => {
    const { child_id, time_table_id, vaccine_id } = req.params;

    if (!child_id || !time_table_id || !vaccine_id) {
        return res.status(400).json({
            message: 'Please add params child_id and time_table_id',
        })
    }

    try {
        const [row] = await pool.query('INSERT INTO taked_vaccine(child_id, time_table_id, vaccine_id) VALUES (?, ?, ?)', [child_id, time_table_id, vaccine_id]);

        if (row.affectedRows > 0) {
            return res.status(200).json({
                message: 'Vaccine use added'
            })
        }
        else {
            return res.status(500).json({
                message: 'Vaccine usgae adding failed'
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}


export const GetGrowthDetailsChart = async (req, res, next) => {
    const { child_id } = req.params;

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ?', [child_id]);

        if (rows.length < 1) return res.status(404).json({ message: 'Child growth detail not found' })

        let table_data = []

        rows.forEach(row => {
            let data = {
                month: row.month,
                weight: row.weight,
            }
            table_data.push(data)
        })

        return res.status(200).json(table_data)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const AddNews = async (req, res, next) => {
    const { title, summary, description } = req.body;

    const author = `{"id":${req.session.midwife.midwife_id.midwife_id},"role":"midwife"}`

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

export const GetAllActivities_ = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM activities');
        return res.status(200).json(rows)
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetChildActivities = async (req, res, next) => {
    const { child_id } = req.params;

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        const [rows] = await pool.query('SELECT done_activities.*, child.*, activities.*, TIMESTAMPDIFF(MONTH, child.child_birthday, CURDATE()) AS months_difference FROM done_activities inner join child on child.child_id = done_activities.child_id inner join activities on activities.activity_id = done_activities.activity_id WHERE done_activities.child_id = ?', [child_id]);
        return res.status(200).json(rows)
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
    }
}
