import express from 'express';
const router = express.Router();
import session from 'express-session';
import { AddNews, DeleteNews, GetNews, GetNewsByID, GetOfficerProfile, GetSummary, Logout, OfficerLogin, UpdateOfficerProfile } from '../methods/OfficerMethod.js';
import multer from 'multer';



router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
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
  if (req.session.officer) {
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
router.post('/login', OfficerLogin);
router.post('/logout', Logout);

router.use(checkAuth);

router.get('/check-auth', (req, res) => res.status(200).json({ message: 'Authorized' }));
router.get('/profile', GetOfficerProfile);
router.put('/profile', UpdateOfficerProfile);
router.post('/add-news', uploadStorage.single('file'), AddNews);
router.get('/news', GetNews);
router.get('/news/:id', GetNewsByID);
router.delete('/news/:id', DeleteNews);
router.get('/report-summary', GetSummary)


export default router;