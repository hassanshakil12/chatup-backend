import jwt from "jsonwebtoken";

export const generateAuthToken = (userId, role) => {
  const payload = {
    _id: userId,
    role: role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};
