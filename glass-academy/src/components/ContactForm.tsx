'use client';

import Button from '@/components/ui/Button';
import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log('Form submitted:', data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">Message Sent!</h2>
        <p className="text-green-700 dark:text-green-300">Thank you for reaching out. We will get back to you shortly.</p>
        <Button 
          variant="secondary" 
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="organization" className="block text-sm font-medium mb-2">Organisation</label>
        <input 
          type="text" 
          id="organization" 
          name="organization" 
          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="projectType" className="block text-sm font-medium mb-2">Project Type</label>
          <select 
            id="projectType" 
            name="projectType" 
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="web">Web Development</option>
            <option value="design">Design</option>
            <option value="data">Data Visualization</option>
            <option value="consulting">Consulting</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-2">Budget Range (Optional)</label>
          <select 
            id="budget" 
            name="budget" 
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Select a range</option>
            <option value="small">Under $10k</option>
            <option value="medium">$10k - $50k</option>
            <option value="large">$50k - $100k</option>
            <option value="enterprise">$100k+</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">Project Description</label>
        <textarea 
          id="description" 
          name="description" 
          rows={5} 
          required 
          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none"
        ></textarea>
      </div>

      <Button type="submit" className="w-full md:w-auto">
        Send Message
      </Button>
    </form>
  );
}
