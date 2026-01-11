import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const UserForgotPasswordPage = () => (
    <ForgotPasswordForm role='USER' loginPath='/login' title='Forgot Password' subtitle="Enter your email and we'll send you a reset link" />
);

export default UserForgotPasswordPage;
