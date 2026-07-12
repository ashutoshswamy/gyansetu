import { Resend } from "resend";

const realResend = new Resend(process.env.RESEND_API_KEY);

// ponytail: email sending disabled app-wide; flip to true (or remove this guard) to re-enable
const EMAIL_ENABLED = false;

export const resend = {
  emails: {
    send: async (...args: Parameters<typeof realResend.emails.send>) => {
      if (!EMAIL_ENABLED) {
        console.log("[resend] email sending disabled, skipped:", args[0]?.subject);
        return { data: null, error: null };
      }
      return realResend.emails.send(...args);
    },
  },
};

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@gyansetu.in";
