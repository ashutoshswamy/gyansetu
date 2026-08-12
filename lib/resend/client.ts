import { Resend } from "resend";

const EMAIL_ENABLED = true;

type SendArgs = Parameters<Resend["emails"]["send"]>;

export const resend = {
  emails: {
    send: async (...args: SendArgs) => {
      if (!EMAIL_ENABLED) {
        console.log("[resend] email sending disabled, skipped:", args[0]?.subject);
        return { data: null, error: null };
      }
      return new Resend(process.env.RESEND_API_KEY).emails.send(...args);
    },
  },
};

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@gyansetu.jnanaprabhodhini.org";
