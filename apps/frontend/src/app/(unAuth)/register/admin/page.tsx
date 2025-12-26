import { ADMIN_API_ROUTES } from '@sakalsense/core';

import { CommonRegisterForm } from '@/components/auth/CommonRegisterForm';

const AdminRegisterPage = () => (
    <CommonRegisterForm
        role='ADMIN'
        apiEndpoint={ADMIN_API_ROUTES.auth.register}
        redirectPath='/admin'
        loginPath='/login/admin'
        title='Admin Registration'
        subtitle='Register as an administrator'
        requireInviteCode
    />
);

export default AdminRegisterPage;
