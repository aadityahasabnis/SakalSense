import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const AdministratorForgotPasswordPage = () => (
    <ForgotPasswordForm role='ADMINISTRATOR' loginPath='/login/administrator' title='Administrator Forgot Password' subtitle="Enter your email and we'll send you a reset link" />
);

export default AdministratorForgotPasswordPage;
