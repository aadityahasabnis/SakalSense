import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ADMINISTRATOR_API_ROUTES } from '@/constants/routes/administrator.routes';

const AdministratorForgotPasswordPage = () => (
    <ForgotPasswordForm
        role='ADMINISTRATOR'
        apiEndpoint={ADMINISTRATOR_API_ROUTES.auth.forgotPassword}
        loginPath='/login/administrator'
        title='Administrator Forgot Password'
        subtitle="Enter your email and we'll send you a reset link"
    />
);

export default AdministratorForgotPasswordPage;
