import express from 'express';
const router = express.Router();
import session from 'express-session';
import multer from 'multer';
import { AddChild, AddChildGrowthDetail, AddNews, CheckMidwifeAuth, CreateParent, DeleteNews, GetAllActivities_, GetAllChild, GetAllVaccine, GetChildActivities, GetChildByID, GetChildGrowthDetailByID, GetGrowthDetailsChart, GetLastChildGrowthDetail, GetNews, GetNewsByID, GetParentByID, GetSDMeasurements, GetVaccineTableForChild, LastGrowthData, MidwifeLogin, MidwifeLogout, UpdateChild, UpdateParent, VaccineGetByChild, getAllParents } from '../methods/MidwifeMethod.js';



router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});


router.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

const checkAuth = (req, res, next) => {
  if (req.session.midwife) {
    next();
  }
  else {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadStorage = multer({ storage: storage })
router.options('*', (req, res) => res.sendStatus(200));


router.options('*', (req, res) => res.sendStatus(200));
router.post('/login', MidwifeLogin);
router.post('/logout', MidwifeLogout);
router.get('/check-auth', CheckMidwifeAuth);

router.use(checkAuth);

router.get('/area', (req, res) => {
  res.json({
    area: req.session.midwife.midwife_id.area_id
  })
});

router.post('/parent', CreateParent);
router.get('/parents', getAllParents);
router.put('/parent/:guardian_nic', UpdateParent);
router.get('/parent/:guardian_nic', GetParentByID);


router.post('/child', AddChild);
router.post('/child/growth_detail/:child_id', AddChildGrowthDetail);
router.get('/child/growth_detail/:child_id', GetChildGrowthDetailByID);
router.get('/child/last-growth_detail/:child_id', GetLastChildGrowthDetail);
router.get('/child/last-growth-data/:child_id', LastGrowthData);
router.get('/child/sd_measurements', GetSDMeasurements);
router.get('/child/vaccine', GetAllVaccine);
router.get('/child/vaccine/:child_id', GetVaccineTableForChild);
router.post('/child/vaccine/:child_id/:time_table_id/:vaccine_id', VaccineGetByChild);
router.get('/child/growth-detail-chart/:child_id', GetGrowthDetailsChart);
router.get('/child', GetAllChild);
router.get('/child/:id', GetChildByID);
router.put('/child/:child_id', UpdateChild);
router.get('/activity', GetAllActivities_)
router.get('/activity/:child_id', GetChildActivities)
router.post('/add-news', uploadStorage.single('file'), AddNews);
router.get('/news', GetNews);
router.get('/news/:id', GetNewsByID);
router.delete('/news/:id', DeleteNews);


export default router;