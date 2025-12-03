import {NextRequest, NextResponse} from 'next/server';

type ContactFormData = {
  name: string;
  email: string;
  organisation?: string;
  projectType?: string;
  budget?: string;
  message: string;
  locale: string;
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server-side validation
function validateContactForm(data: ContactFormData): { valid: boolean; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Validate email
  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.email = 'Valid email address is required';
  }

  // Validate message
  if (!data.message || data.message.trim().length < 20) {
    errors.message = 'Message must be at least 20 characters';
  }

  return Object.keys(errors).length > 0 ? { valid: false, errors } : { valid: true };
}

// Sanitize input to prevent injection
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data: ContactFormData = body;

    // Validate the form data
    const validation = validateContactForm(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      organisation: data.organisation ? sanitizeInput(data.organisation) : '',
      projectType: data.projectType || '',
      budget: data.budget || '',
      message: sanitizeInput(data.message),
      locale: data.locale
    };

    // Log submission to console (in production, this would send to email/CRM)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Contact Form Submission]');
    console.log('Time:', new Date().toISOString());
    console.log('Locale:', sanitizedData.locale);
    console.log('Name:', sanitizedData.name);
    console.log('Email:', sanitizedData.email);
    console.log('Organisation:', sanitizedData.organisation || 'N/A');
    console.log('Project Type:', sanitizedData.projectType || 'N/A');
    console.log('Budget:', sanitizedData.budget || 'N/A');
    console.log('Message:', sanitizedData.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // TODO: In production, integrate with:
    // - Email service (SendGrid, AWS SES, Mailgun)
    // - CRM (HubSpot, Salesforce, Pipedrive)
    // - Slack/Discord notifications
    // - Database storage

    // Example email service integration (commented out):
    /*
    if (process.env.EMAIL_SERVICE_API_KEY) {
      await sendEmail({
        to: process.env.CONTACT_EMAIL || 'contact@glasscode.academy',
        from: process.env.FROM_EMAIL || 'noreply@glasscode.academy',
        subject: `New Contact Form Submission from ${sanitizedData.name}`,
        text: `
          Name: ${sanitizedData.name}
          Email: ${sanitizedData.email}
          Organisation: ${sanitizedData.organisation || 'N/A'}
          Project Type: ${sanitizedData.projectType || 'N/A'}
          Budget: ${sanitizedData.budget || 'N/A'}
          
          Message:
          ${sanitizedData.message}
        `
      });
    }
    */

    return NextResponse.json(
      { success: true, message: 'Submission received' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error occurred' },
      { status: 500 }
    );
  }
}
