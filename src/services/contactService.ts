import { ContactFormData } from "../types/contact";
import { sendContactEmails } from "../utils/mailer";

export class ContactService {
  async processContactForm(formData: ContactFormData): Promise<{
    success: boolean;
    userEmailSent: boolean;
    adminEmailSent: boolean;
  }> {
    try {
      // Validasi data
      this.validateContactData(formData);

      // Process emails
      const { userEmailSent, adminEmailSent } = await sendContactEmails(
        formData
      );

      // Log success
      console.log("📧 Contact form processed:", {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        timestamp: new Date().toISOString(),
      });

      return {
        success: userEmailSent && adminEmailSent,
        userEmailSent,
        adminEmailSent,
      };
    } catch (error) {
      console.error("❌ Contact service error:", error);
      throw error;
    }
  }

  private validateContactData(formData: ContactFormData): void {
    const requiredFields = ["firstName", "email", "message"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof ContactFormData]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error("Invalid email format");
    }
  }
}

export default new ContactService();
