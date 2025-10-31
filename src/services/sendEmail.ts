import dotenv from "dotenv";
dotenv.config();
import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN as string,
  url: "https://api.mailgun.net",
});

export const sendEmail =  async ({
  to,
  subject,
  text,
  html,
  template,
  dynamicTemplateData,
  from
}) => {
  try {
    const msg: any = {
      from: from || process.env.SENDER_EMAIL,
      to: to,
      subject
    }
    if (template) {
      msg.template = template;
      msg['t:variables'] = JSON.stringify(dynamicTemplateData);
    }
    else if (html) {
      msg.html = html;
    }
    else {
      msg.text = text;
    }

    const data = await mg.messages.create("sodio.tech", msg);
    console.log(data);
  } catch (error: any) {
    console.log(error);
    throw new Error("Error sending email: ", error);
  }
}

