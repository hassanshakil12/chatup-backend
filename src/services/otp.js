import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/generators/index.js";

class OTPService {
  constructor() {
    this.redis = redisClient;
    this.OTP_EXPIRY = process.env.OTP_EXPIRY;
    this.RESEND_COOLDOWN = process.env.RESEND_COOLDOWN;
    this.MAX_ATTEMPTS = process.env.MAX_ATTEMPTS;
  }

  async createOTP(identifier, type, data = {}) {
    try {
      // Check cooldown period
      const cooldownKey = `cooldown:${identifier}:${type}`;
      const hasCooldown = await this.redis.exists(cooldownKey);

      if (hasCooldown) {
        const ttl = await this.redis.ttl(cooldownKey);
        throw new Error(
          `Please wait ${ttl} seconds before requesting a new OTP`
        );
      }

      // Generate OTP
      const otp = generateOTP(); // Assuming this returns a 6-digit string

      // Create OTP payload
      const otpPayload = {
        otp,
        type,
        data,
        identifier,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
      };

      // Store OTP with expiry
      const otpKey = `otp:${identifier}:${type}`;
      await this.redis.setex(
        otpKey,
        this.OTP_EXPIRY,
        JSON.stringify(otpPayload)
      );

      // Set cooldown to prevent immediate resend
      await this.redis.setex(cooldownKey, this.RESEND_COOLDOWN, "1");

      console.log(`OTP created for ${identifier}, type: ${type}`);

      return {
        success: true,
        otp,
        identifier,
        type,
        expiresIn: this.OTP_EXPIRY,
        cooldown: this.RESEND_COOLDOWN,
        username: data.username || null,
      };
    } catch (error) {
      console.error("Error creating OTP:", error);
      throw error;
    }
  }

  async verifyOTP(identifier, type, userOtp) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      const otpData = await this.redis.get(otpKey);

      // Check if OTP exists
      if (!otpData) {
        return {
          success: false,
          message: "OTP not found or expired",
          code: "OTP_EXPIRED",
        };
      }

      const payload = JSON.parse(otpData);

      // Check attempts limit
      if (payload.attempts >= payload.maxAttempts) {
        await this.redis.del(otpKey);
        return {
          success: false,
          message: "Too many failed attempts. OTP has been blocked",
          code: "OTP_BLOCKED",
        };
      }

      // Verify OTP
      if (Number(payload.otp) !== Number(userOtp)) {
        // Increment failed attempts
        payload.attempts += 1;
        await this.redis.setex(
          otpKey,
          this.OTP_EXPIRY,
          JSON.stringify(payload)
        );

        const attemptsLeft = payload.maxAttempts - payload.attempts;

        return {
          success: false,
          message: `Invalid OTP. ${attemptsLeft} attempt(s) left`,
          code: "INVALID_OTP",
          attemptsLeft,
        };
      }

      // OTP is valid - delete it and return success
      await this.redis.del(otpKey);

      // Also delete cooldown key
      await this.redis.del(`cooldown:${identifier}:${type}`);

      console.log(`OTP verified for ${identifier}, type: ${type}`);

      return {
        success: true,
        message: "OTP verified successfully",
        data: payload.data,
        identifier,
        type,
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  async resendOTP(identifier, type) {
    try {
      // Delete existing OTP to allow new one
      const otpKey = `otp:${identifier}:${type}`;
      const existingData = await this.redis.get(otpKey);

      let data = {};
      if (existingData) {
        const existingPayload = JSON.parse(existingData);
        data = existingPayload.data || {};
      }

      // Delete cooldown to allow immediate resend
      await this.redis.del(`cooldown:${identifier}:${type}`);

      // Create new OTP
      return await this.createOTP(identifier, type, data);
    } catch (error) {
      console.error("Error resending OTP:", error);
      throw error;
    }
  }

  async getOTPStatus(identifier, type) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      const cooldownKey = `cooldown:${identifier}:${type}`;

      const [otpData, ttl, cooldownExists] = await Promise.all([
        this.redis.get(otpKey),
        this.redis.ttl(otpKey),
        this.redis.exists(cooldownKey),
      ]);

      let payload = null;
      if (otpData) {
        payload = JSON.parse(otpData);
        // Don't expose the actual OTP code
        delete payload.otp;
      }

      return {
        exists: !!otpData,
        cooldownActive: !!cooldownExists,
        timeRemaining: ttl > 0 ? ttl : 0,
        data: payload,
        canResend: !cooldownExists,
      };
    } catch (error) {
      console.error("Error getting OTP status:", error);
      throw error;
    }
  }

  async cleanupOTP(identifier, type) {
    try {
      const otpKey = `otp:${identifier}:${type}`;
      const cooldownKey = `cooldown:${identifier}:${type}`;

      await Promise.all([this.redis.del(otpKey), this.redis.del(cooldownKey)]);

      console.log(`Cleaned up OTP for ${identifier}, type: ${type}`);
    } catch (error) {
      console.error("Error cleaning up OTP:", error);
      throw error;
    }
  }
}

export default OTPService;
