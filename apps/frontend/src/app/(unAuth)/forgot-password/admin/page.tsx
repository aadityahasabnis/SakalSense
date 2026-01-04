import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ADMIN_API_ROUTES } from '@/constants/routes/admin.routes';

const AdminForgotPasswordPage = () => (
    <ForgotPasswordForm
        role='ADMIN'
        apiEndpoint={ADMIN_API_ROUTES.auth.forgotPassword}
        loginPath='/login/admin'
        title='Admin Forgot Password'
        subtitle="Enter your email and we'll send you a reset link"
    />
);

export default AdminForgotPasswordPage;
