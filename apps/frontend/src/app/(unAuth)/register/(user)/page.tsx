import { CommonRegisterForm } from '@/components/auth/CommonRegisterForm';

const UserRegisterPage = () => (
    <CommonRegisterForm role='USER' redirectPath='/' loginPath='/login' title='Create Account' subtitle='Join SakalSense today' />
);

export default UserRegisterPage;
