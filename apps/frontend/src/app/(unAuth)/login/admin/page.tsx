import { CommonLoginForm } from '@/components/auth/CommonLoginForm';
import { ADMIN_API_ROUTES } from '@/constants/routes/admin.routes';

const AdminLoginPage = () => (
    <CommonLoginForm
        role='ADMIN'
        apiEndpoint={ADMIN_API_ROUTES.auth.login}
        redirectPath='/admin'
        registerPath='/register/admin'
        forgotPasswordPath='/forgot-password/admin'
        title='Admin Portal'
        subtitle='Sign in to manage SakalSense'
    />
);

export default AdminLoginPage;
