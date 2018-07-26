import SparkPost from 'sparkpost';
import { sparkpostKey } from '../../config';

const client = new SparkPost(sparkpostKey);

export default async (
  recipient,
  key,
  from = 'testing@sparkpostbox.com',
  subject,
  text = 'test mail'
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
        <p>Use this key:${key}</p>
        </body>
        </html>`
    },
    recipients: [{ address: recipient }]
  });
};
