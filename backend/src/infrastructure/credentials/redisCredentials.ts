import dotenv from 'dotenv';
dotenv.config();

const host = process.env.redis_host as string;
const password = process.env.redis_password as string;
const port = Number(process.env.redis_port);

export default {
  password,
  socket: {
    host,
    port,
  },
};
