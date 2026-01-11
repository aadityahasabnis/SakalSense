import { CommonLoginForm } from '@/components/auth/CommonLoginForm';

const AdminLoginPage = () => (
    <CommonLoginForm
        role='ADMIN'
        redirectPath='/admin'
        registerPath='/register/admin'
        forgotPasswordPath='/forgot-password/admin'
        title='Admin Portal'
        subtitle='Sign in to manage SakalSense'
    />
);

export default AdminLoginPage;
