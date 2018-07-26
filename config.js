import dotenv from 'dotenv';

dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
export const isDevelopment = !isProduction;
export const environment = process.env.NODE_ENV;

export const host = process.env.HOST;
export const port = isTest ? 0 : process.env.PORT;
export const portClient = process.env.PORT_CLIENT;
export const hostClient = process.env.HOST_CLIENT;

export const sparkpostKey = process.env.SPARKPOST_API_KEY;
export const sessionSecret = process.env.SESSION_SECRET;
