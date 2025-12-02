import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { Queue, Worker } from "bullmq";

import redisClient from "../config/redis.js";
import emailTransporter from "../config/nodemailer.js";

// Initialize queue
export const emailQueue = new Queue("emailQueue", {
  connection: redisClient,
});

// Process email sending
const sendEmail = async ({ to, subject, template, context }) => {
  try {
    // Construct template path
    const emailTemplatePath = path.join(
      process.cwd(),
      "src",
      "utils",
      "templates",
      "email",
      `${template}.html`
    );

    // Read and compile template
    const emailTemplateSource = fs.readFileSync(emailTemplatePath, "utf-8");
    const compiledTemplate = handlebars.compile(emailTemplateSource);
    const html = compiledTemplate({ ...context });

    // Prepare mail options
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };

    // Send email
    await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return { success: true, message: `Email sent to ${to}` };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    throw new Error(`Email sending failed: ${err.message}`);
  }
};

// Initialize worker
export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, template, context } = job.data;
    return await sendEmail({ to, subject, template, context });
  },
  {
    connection: redisClient,
    // Optional: Configure concurrency and retry settings
    concurrency: 5,
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
    },
  }
);

// Handle worker events
emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for ${job.data.to}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed for ${job?.data?.to}:`, err.message);
});

// Queue management functions
export const addEmailToQueue = async (emailData) => {
  try {
    const job = await emailQueue.add("sendEmail", emailData, {
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: "exponential",
        delay: 2000, // 2 seconds delay between retries
      },
    });
    console.log(`Email job ${job.id} added to queue for ${emailData.to}`);
    return job;
  } catch (err) {
    console.error("Failed to add email to queue:", err.message);
    throw err;
  }
};

// Helper function to send email immediately (without queue)
export const sendEmailDirect = async ({ to, subject, template, context }) => {
  return await sendEmail({ to, subject, template, context });
};

// Optional: Queue monitoring and management functions
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

// Cleanup function
export const closeQueue = async () => {
  await emailWorker.close();
  await emailQueue.close();
};

export default { addEmailToQueue, sendEmailDirect, getQueueStats, closeQueue };
