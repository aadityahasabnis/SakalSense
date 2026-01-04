import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { USER_API_ROUTES } from '@/constants/routes/user.routes';

const UserForgotPasswordPage = () => (
    <ForgotPasswordForm
        role='USER'
        apiEndpoint={USER_API_ROUTES.auth.forgotPassword}
        loginPath='/login'
        title='Forgot Password'
        subtitle="Enter your email and we'll send you a reset link"
    />
);

export default UserForgotPasswordPage;
