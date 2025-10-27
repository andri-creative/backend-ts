import { Request, Response } from "express";
import { ContactFormData } from "../../types/contact";
import { sendContactEmails } from "../../utils/mailer"; // Import dari mailer

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const formData: ContactFormData = req.body;

    // Validasi basic
    if (!formData.firstName || !formData.email || !formData.message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    console.log("📧 Processing contact form submission:", {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      country: formData.country,
    });

    // Send both emails using the new function
    const { userEmailSent, adminEmailSent } = await sendContactEmails(formData);

    if (userEmailSent && adminEmailSent) {
      console.log("✅ All emails sent successfully for:", formData.email);

      res.status(200).json({
        success: true,
        message:
          "Message sent successfully! Check your email for confirmation.",
      });
    } else {
      console.log("⚠️ Partial email failure for:", formData.email);

      res.status(207).json({
        // 207 Multi-Status
        success: true,
        message:
          "Message received! You should receive a confirmation email shortly. If not, we will contact you soon.",
      });
    }
  } catch (error) {
    console.error("❌ Contact form error:", error);

    // Beri response yang lebih spesifik berdasarkan error
    if (error instanceof Error) {
      if (error.message.includes("Gagal mengirim email")) {
        return res.status(502).json({
          success: false,
          message:
            "Email service temporarily unavailable. Please try again later or contact us directly.",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};
