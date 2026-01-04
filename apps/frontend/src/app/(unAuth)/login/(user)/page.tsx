import { CommonLoginForm } from '@/components/auth/CommonLoginForm';
import { USER_API_ROUTES } from '@/constants/routes/user.routes';

const UserLoginPage = () => (
    <CommonLoginForm
        role='USER'
        apiEndpoint={USER_API_ROUTES.auth.login}
        redirectPath='/'
        registerPath='/register'
        forgotPasswordPath='/forgot-password'
        title='Welcome Back'
        subtitle='Sign in to continue to SakalSense'
    />
);

export default UserLoginPage;
