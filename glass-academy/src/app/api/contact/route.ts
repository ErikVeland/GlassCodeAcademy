import {NextRequest, NextResponse} from 'next/server';

type ContactFormData = {
  name: string;
  email: string;
  organisation?: string;
  projectType?: string;
  budget?: string;
  message: string;
  locale: string;
  website?: string;
  formStart?: number;
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

    const now = Date.now();
    const started = typeof data.formStart === 'number' ? data.formStart : now;
    const elapsedMs = now - started;
    if (data.website && data.website.trim() !== '') {
      return NextResponse.json({ success: true, message: 'Submission received' }, { status: 200 });
    }
    if (elapsedMs < 4000) {
      return NextResponse.json({ success: true, message: 'Submission received' }, { status: 200 });
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

    const toEmail = process.env.CONTACT_TO || 'erik@veland.au';
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      const subject = `New enquiry from ${sanitizedData.name}`;
      const text = [
        `Time: ${new Date().toISOString()}`,
        `Locale: ${sanitizedData.locale}`,
        `Name: ${sanitizedData.name}`,
        `Email: ${sanitizedData.email}`,
        `Organisation: ${sanitizedData.organisation || 'N/A'}`,
        `Project Type: ${sanitizedData.projectType || 'N/A'}`,
        `Budget: ${sanitizedData.budget || 'N/A'}`,
        '',
        'Message:',
        sanitizedData.message
      ].join('\n');

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111;">
          <h2 style="margin:0 0 12px">New enquiry</h2>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Locale:</strong> ${sanitizedData.locale}</p>
          <p><strong>Name:</strong> ${sanitizedData.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
          <p><strong>Organisation:</strong> ${sanitizedData.organisation || 'N/A'}</p>
          <p><strong>Project Type:</strong> ${sanitizedData.projectType || 'N/A'}</p>
          <p><strong>Budget:</strong> ${sanitizedData.budget || 'N/A'}</p>
          <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb" />
          <p style="white-space:pre-wrap;">${sanitizedData.message}</p>
        </div>
      `;

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM || 'noreply@glasscode.academy',
          to: [toEmail],
          reply_to: sanitizedData.email,
          subject,
          text,
          html
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Email send failed:', errText);
        return NextResponse.json(
          { success: false, message: 'Failed to send email' },
          { status: 502 }
        );
      }
    } else {
      console.warn('RESEND_API_KEY not set; enquiry not emailed');
    }

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
