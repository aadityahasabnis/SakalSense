import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const AdminForgotPasswordPage = () => (
    <ForgotPasswordForm role='ADMIN' loginPath='/login/admin' title='Admin Forgot Password' subtitle="Enter your email and we'll send you a reset link" />
);

export default AdminForgotPasswordPage;
