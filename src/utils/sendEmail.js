import SparkPost from 'sparkpost';
import { sparkpostKey } from '../../config';

const client = new SparkPost(sparkpostKey);

export default async (
  recipient,
  text = 'put some text to sendMail func',
  from = 'testing@sparkpostbox.com',
  subject
) => {
  await client.transmissions.send({
    options: {
      sandbox: true
    },
    content: {
      from,
      subject,
      html: `<html>
        <body>
        <p>${text}</p>
        </body>
        </html>`
    },
    recipients: [{ address: recipient }]
  });
};
