import { CommonRegisterForm } from '@/components/auth/CommonRegisterForm';
import { ADMIN_API_ROUTES } from '@/constants/routes/admin.routes';

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
