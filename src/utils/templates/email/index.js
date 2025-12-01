import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

// Store compiled templates
const templates = new Map();

// Load and compile a template
export async function loadTemplate(templateName) {
  try {
    const templatePath = path.join("./templates", `${templateName}.html`);
    const templateFile = await fs.readFile(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(templateFile);
    templates.set(templateName, compiledTemplate);
    console.log(`Template "${templateName}" loaded successfully`);
    return compiledTemplate;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

// Load multiple templates at once
export async function loadTemplates(templateNames) {
  await Promise.all(templateNames.map((name) => loadTemplate(name)));
}

// Main reusable function to send email
export async function sendEmail(transporter, options) {
  const {
    templateName,
    to,
    subject,
    data = {},
    from = process.env.EMAIL_FROM,
    attachments = [],
  } = options;

  // Check if template is loaded
  if (!templates.has(templateName)) {
    throw new Error(
      `Template "${templateName}" not found. Load it first using loadTemplate().`
    );
  }

  // Generate HTML content
  const template = templates.get(templateName);
  const htmlContent = template({
    appName: "ChatUp",
    supportEmail: "support@chatup.com",
    currentYear: new Date().getFullYear(),
    ...data,
  });

  // Send email
  const mailOptions = {
    from,
    to,
    subject,
    html: htmlContent,
    attachments,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to} using template "${templateName}"`);
  return result;
}
