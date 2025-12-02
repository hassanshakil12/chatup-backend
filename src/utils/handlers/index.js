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

export const sanitizeUserData = (data, SENSITIVE_FIELDS) => {
  const sanitized = { ...data };

  // Remove sensitive fields
  SENSITIVE_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  // Remove any fields with 'token' in the name (safety catch)
  Object.keys(sanitized).forEach((key) => {
    if (key.toLowerCase().includes("token")) {
      delete sanitized[key];
    }
  });

  // Remove any fields with 'secret' in the name
  Object.keys(sanitized).forEach((key) => {
    if (key.toLowerCase().includes("secret")) {
      delete sanitized[key];
    }
  });

  return sanitized;
};

export const calculateUserProfileCompletion = (user) => {
  const completionFields = [
    { field: "email", weight: 10 },
    { field: "displayName", weight: 10 },
    { field: "phoneNumber", weight: 10 },
    { field: "birthDate", weight: 10 },
    { field: "gender", weight: 10 },
    { field: "profileImage", weight: 10 },
    { field: "coverImage", weight: 10 },
    { field: "bio", weight: 10 },
    { field: "website", weight: 20 },
    // { field: "location", weight: 10 },
  ];

  let completion = 0;
  completionFields.forEach(({ field, weight }) => {
    if (user[field]) {
      if (Array.isArray(user[field]) && user[field].length > 0) {
        completion += weight;
      } else if (!Array.isArray(user[field]) && user[field].toString().trim()) {
        completion += weight;
      }
    }
  });

  return Math.min(100, completion);
};
