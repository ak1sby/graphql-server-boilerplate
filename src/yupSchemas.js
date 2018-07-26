import * as yup from 'yup';
import errorMess from './errorMess';

export default yup.object().shape({
  email: yup
    .string()
    .min(3, errorMess.emailNotLongEnough)
    .max(255)
    .email(errorMess.invalidEmail),
  password: yup
    .string()
    .min(3, errorMess.passwordNotLongEnough)
    .max(255)
});
