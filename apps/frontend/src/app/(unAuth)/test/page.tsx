'use client';

// =============================================
// Test Form Page - All Field Types Demo
// =============================================

import { Form } from '@/components/form/Form';
import { type IApiResponse } from '@/lib/interfaces';
import { type FormConfig, type FormValues } from '@/types/form.types';

// =============================================
// Form Configuration with ALL Field Types
// =============================================

const testFormConfig: FormConfig = {
    layout: { cols: 2, responsive: { sm: 1, md: 2 } },
    fields: [
        // Heading
        { type: 'heading', text: 'Personal Information', description: 'Basic details about you' },

        // Text inputs
        { type: 'text', name: 'fullName', label: 'Full Name', placeholder: 'John Doe', required: true, description: 'Your legal name' },
        { type: 'email', name: 'email', label: 'Email', placeholder: 'john@example.com', required: true },
        { type: 'phone', name: 'phone', label: 'Phone Number', placeholder: '+91 9876543210' },
        { type: 'url', name: 'website', label: 'Website', placeholder: 'https://example.com' },

        // Separator
        { type: 'separator' },

        // Heading
        { type: 'heading', text: 'Account Security' },

        // Password
        { type: 'password', name: 'password', label: 'Password', placeholder: '••••••••', required: true, minLength: 6 },
        { type: 'password', name: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', required: true },

        // Separator
        { type: 'separator' },

        // Heading
        { type: 'heading', text: 'Additional Details' },

        // Number
        { type: 'number', name: 'age', label: 'Age', placeholder: '25', min: 18, max: 100 },

        // Date
        { type: 'date', name: 'birthDate', label: 'Birth Date', placeholder: 'Select date' },

        // Select
        {
            type: 'select',
            name: 'country',
            label: 'Country',
            placeholder: 'Select country',
            options: [
                { value: 'in', label: 'India' },
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
            ],
        },

        // Textarea
        { type: 'textarea', name: 'bio', label: 'Bio', placeholder: 'Tell us about yourself...', rows: 4, colSpan: 'full' },

        // Separator
        { type: 'separator' },

        // Heading
        { type: 'heading', text: 'Preferences' },

        // Single Checkbox
        { type: 'checkbox', name: 'subscribe', label: 'Subscribe to newsletter' },

        // Checkbox Group
        {
            type: 'checkbox',
            name: 'interests',
            label: 'Interests',
            description: 'Select all that apply',
            options: [
                { value: 'tech', label: 'Technology' },
                { value: 'sports', label: 'Sports' },
                { value: 'music', label: 'Music' },
                { value: 'travel', label: 'Travel' },
            ],
        },

        // Radio Group
        {
            type: 'radio',
            name: 'gender',
            label: 'Gender',
            options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
            ],
        },

        // Switch
        { type: 'switch', name: 'notifications', label: 'Enable notifications' },
        { type: 'switch', name: 'darkMode', label: 'Dark mode' },

        // Separator
        { type: 'separator' },

        // File Upload
        { type: 'file', name: 'avatar', label: 'Profile Picture', accept: 'image/*', colSpan: 'full' },

        // Separator
        { type: 'separator' },

        // Heading
        { type: 'heading', text: 'Rich Content', description: 'Create formatted content' },

        // Editor
        { type: 'editor', name: 'content', label: 'Content', placeholder: 'Start writing...', minHeight: 300, colSpan: 'full' },

        // Hidden field
        { type: 'hidden', name: 'source', defaultValue: 'test-form' },
    ],
    submit: {
        label: 'Submit Form',
        loadingLabel: 'Submitting...',
        action: async (values: FormValues): Promise<IApiResponse> => {
            // Log the form data to console
            console.log('='.repeat(50));
            console.log('Form Submitted - JSON Data:');
            console.log(JSON.stringify(values, null, 4));
            console.log('='.repeat(50));

            // Simulate success response
            return { success: true, status: 200, message: 'Form submitted successfully! Check console for data.' };
        },
        onSuccess: () => {
            alert('Form submitted! Check browser console for JSON data.');
        },
    },
};

// =============================================
// Page Component
// =============================================

export default function TestFormPage() {
    return (
        <div className="bg-background min-h-screen px-4 py-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Form Configuration System Test</h1>
                    <p className="text-muted-foreground mt-2">All field types demonstration</p>
                </div>

                <div className="rounded-lg border p-6 shadow-sm">
                    <Form config={testFormConfig} />
                </div>
            </div>
        </div>
    );
}
