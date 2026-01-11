import { CommonLoginForm } from '@/components/auth/CommonLoginForm';

const UserLoginPage = () => (
    <CommonLoginForm
        role='USER'
        redirectPath='/'
        registerPath='/register'
        forgotPasswordPath='/forgot-password'
        title='Welcome Back'
        subtitle='Sign in to continue to SakalSense'
    />
);

export default UserLoginPage;
