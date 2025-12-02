export const apiResponse = ({
  res,
  status,
  isConsole = false,
  code = null,
  success = true,
  message = null,
  data = null,
}) => {
  if (isConsole) {
    console.log(`${code} - ${message}`);
  }
  return res.status(status).json({ success, message, data });
};
