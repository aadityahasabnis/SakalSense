import { USER_API_ROUTES } from 'sakalsense-core';

import { CommonRegisterForm } from '@/components/auth/CommonRegisterForm';

const UserRegisterPage = () => (
    <CommonRegisterForm role='USER' apiEndpoint={USER_API_ROUTES.auth.register} redirectPath='/' loginPath='/login' title='Create Account' subtitle='Join SakalSense today' />
);

export default UserRegisterPage;
