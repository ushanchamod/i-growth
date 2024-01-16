import express from 'express';
import { AddNews, AdminLogin, AdminLogout, CheckAdminAuth, CrateAdmin, CreateMidwife, CreateOfficer, DeleteMidwife, DeleteNews, DeleteOfficer, GetAdminAllowedArea, GetAllAdmin, GetAllDistrict, GetAllMidwifes, GetMidwifeByID, GetNews, GetNewsByID, GetOfficerByAreaID, GetOfficerByID, UpdateMidwife, UpdateOfficer, getAllOfficers } from '../methods/AdminMethod.js';
const router = express.Router();
import session from 'express-session';
import multer from 'multer';


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


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadStorage = multer({ storage: storage })

const checkAuth = (req, res, next) => {
  if (req.session.admin) {
    next();
  }
  else {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }
}

router.options('*', (req, res) => res.sendStatus(200));

router.options('*', (req, res) => res.sendStatus(200));
router.post('/login', AdminLogin); // ok
router.post('/logout', AdminLogout);
router.get('/check-auth', CheckAdminAuth);

router.use(checkAuth);
router.post('/admin', CrateAdmin); //ok
router.get('/admins', GetAllAdmin) // ok
router.get('/district', GetAllDistrict)

router.get('/admin-type', (req, res) => {
  const isSupper = req.session.admin.admin_id.super == 1 ? true : false
  res.json({
    isSupperAdmin: isSupper
  })
})

router.use((req, res, next) => {
  if (req.session.admin.admin_id.super == 1) {
    res.status(401).json({
      message: 'Not Permission'
    })
  }
  else {
    next();
  }
})

router.get('/allowed-area', GetAdminAllowedArea)
router.post('/create-midwife', CreateMidwife); // ok
router.delete('/midwife/:id', DeleteMidwife);
router.get('/midwifes', GetAllMidwifes); // ok
router.get('/midwife/:id', GetMidwifeByID); //ok
router.put('/midwife/:id', UpdateMidwife); // ok
router.post('/create-officer', CreateOfficer); // ok
router.delete('/officer/:id', DeleteOfficer); // ok
router.put('/officer/:id', UpdateOfficer); // ok
router.post('/add-news', uploadStorage.single('file'), AddNews);
router.get('/news', GetNews);
router.get('/news/:id', GetNewsByID);
router.delete('/news/:id', DeleteNews);

router.get('/get-all-officer', getAllOfficers); // ok
router.get('/get-officer/:id', GetOfficerByID); // ok
router.get('/get-officers-by-area/:id', GetOfficerByAreaID); // ok


export default router;