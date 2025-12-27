import { USER_API_ROUTES } from 'sakalsense-core';

import { CommonLoginForm } from '@/components/auth/CommonLoginForm';

const UserLoginPage = () => (
    <CommonLoginForm role='USER' apiEndpoint={USER_API_ROUTES.auth.login} redirectPath='/' registerPath='/register' title='Welcome Back' subtitle='Sign in to continue to SakalSense' />
);

export default UserLoginPage;
