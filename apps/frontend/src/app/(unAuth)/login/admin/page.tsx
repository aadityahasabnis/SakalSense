import { ADMIN_API_ROUTES } from '@sakalsense/core';

import { CommonLoginForm } from '@/components/auth/CommonLoginForm';

const AdminLoginPage = () => (
    <CommonLoginForm role='ADMIN' apiEndpoint={ADMIN_API_ROUTES.auth.login} redirectPath='/admin' registerPath='/register/admin' title='Admin Portal' subtitle='Sign in to manage SakalSense' />
);

export default AdminLoginPage;
