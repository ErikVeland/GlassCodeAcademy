'use client';

import {useTranslations} from 'next-intl';
import Button from '@/components/ui/Button';
import {FormEvent, useState} from 'react';

type ContactFormProps = {
  locale: 'en' | 'nb' | 'nn';
};

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export default function ContactForm({ locale }: ContactFormProps) {
  const t = useTranslations('contact.form');
  const tErrors = useTranslations('contact.form.errors');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'name') {
      if (!value.trim()) return tErrors('name.required');
      if (value.trim().length < 2) return tErrors('name.tooShort');
    }
    if (name === 'email') {
      if (!value.trim()) return tErrors('email.required');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return tErrors('email.invalid');
    }
    if (name === 'message') {
      if (!value.trim()) return tErrors('message.required');
      if (value.trim().length < 20) return tErrors('message.tooShort');
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      organisation: formData.get('organisation') as string,
      projectType: formData.get('projectType') as string,
      budget: formData.get('budget') as string,
      message: formData.get('message') as string,
      locale
    };

    // Validate all required fields
    const newErrors: FormErrors = {};
    newErrors.name = validateField('name', data.name);
    newErrors.email = validateField('email', data.email);
    newErrors.message = validateField('message', data.message);

    const hasErrors = Object.values(newErrors).some(error => error !== undefined);
    
    if (hasErrors) {
      setErrors(newErrors);
      // Focus first error field
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof FormErrors]);
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSubmitStatus('success');
        e.currentTarget.reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
          {t('success.heading')}
        </h2>
        <p className="text-green-700 dark:text-green-300 mb-6">
          {t('success.message')}
        </p>
        <Button 
          variant="secondary" 
          onClick={() => setSubmitStatus('idle')}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <>
      {submitStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6" role="alert">
          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
            {t('error.heading')}
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            {t('error.message')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              {t('fields.name.label')} <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input 
              type="text" 
              id="name" 
              name="name"
              placeholder={t('fields.name.placeholder')}
              onBlur={handleBlur}
              required
              aria-required="true"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className="w-full px-4 py-2 rounded-md border border-border bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t('fields.email.label')} <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder={t('fields.email.placeholder')}
              onBlur={handleBlur}
              required
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="w-full px-4 py-2 rounded-md border border-border bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Organisation */}
        <div>
          <label htmlFor="organisation" className="block text-sm font-medium mb-2">
            {t('fields.organisation.label')}
          </label>
          <input 
            type="text" 
            id="organisation" 
            name="organisation"
            placeholder={t('fields.organisation.placeholder')}
            className="w-full px-4 py-2 rounded-md border border-border bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Type */}
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium mb-2">
              {t('fields.projectType.label')}
            </label>
            <select 
              id="projectType" 
              name="projectType"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">{t('fields.projectType.placeholder')}</option>
              <option value="product">{t('projectTypes.product')}</option>
              <option value="dataviz">{t('projectTypes.dataviz')}</option>
              <option value="investigative">{t('projectTypes.investigative')}</option>
              <option value="education">{t('projectTypes.education')}</option>
              <option value="other">{t('projectTypes.other')}</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-2">
              {t('fields.budget.label')}
            </label>
            <select 
              id="budget" 
              name="budget"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">{t('fields.budget.placeholder')}</option>
              <option value="under_25k">{t('budgets.under_25k')}</option>
              <option value="25k_50k">{t('budgets.25k_50k')}</option>
              <option value="50k_100k">{t('budgets.50k_100k')}</option>
              <option value="100k_plus">{t('budgets.100k_plus')}</option>
              <option value="not_sure">{t('budgets.not_sure')}</option>
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            {t('fields.message.label')} <span className="text-red-500" aria-label="required">*</span>
          </label>
          <textarea 
            id="message" 
            name="message"
            rows={6}
            placeholder={t('fields.message.placeholder')}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className="w-full px-4 py-2 rounded-md border border-border bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          variant="primary"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </>
  );
}
