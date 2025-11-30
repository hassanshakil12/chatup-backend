export const apiResponse = ({
  res,
  status,
  console = false,
  code = null,
  success = true,
  message = null,
  data = null,
}) => {
  if (console) {
    console.log(`${code} - ${message}`);
  }
  return res.status(status).json({ success, message, data });
};
