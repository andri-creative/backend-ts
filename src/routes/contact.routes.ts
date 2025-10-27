import { Router } from 'express';
import { submitContactForm } from '../controllers/contact/contact.controller';

const router = Router();

// POST /api/contact - Submit contact form
router.post('/', submitContactForm);

// Optional: GET endpoint untuk health check
router.get('//health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Contact Form API',
    timestamp: new Date().toISOString()
  });
});

export default router;