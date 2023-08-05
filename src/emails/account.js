const sgMail = require('@sendgrid/mail');

const sendgridAPI_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sendgridAPI_KEY);

const sendWelcomeEmail = async (email, name) => {
  try {
    await sgMail.send({
      to: email,
      from: '**********@gmail.com',
      subject: 'thanks for joining in.',
      text: `Welcome to app, ${name}. Let us know how to get along with the app.`,
    });
    //console.log('warn welcome', 'Email sent successfully');
  } catch (e) {
    // console.log('warn e welcome', e.response.body);
  }
};
const sendCancelEmail = async (email, name) => {
  try {
    await sgMail.send({
      to: email,
      from: 'omarehabsal@gmail.com',
      subject: 'We are so sad to see you leave',
      text: `We are sad to know your are deleting your email, ${name}. Let us know why. to improve our service`,
    });
    // console.log('warn cancel', 'Email sent successfully');
  } catch (e) {
    // console.log('warn e candel', e.response.body);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail,
};
