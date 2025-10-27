export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  message: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}
