import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: "gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "uc.chamod.public@gmail.com",
      pass: "jhqwpvtnluihkawp"
    },
});