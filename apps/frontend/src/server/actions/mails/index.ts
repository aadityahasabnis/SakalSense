'use server';

// =============================================
// Mail Server Actions - Test mail, OTP, password reset
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { ADMINISTRATOR_API_ROUTES } from '@/constants/routes/administrator.routes';
import { apiCall } from '@/lib/api';
import { type IApiResponse } from '@/lib/interfaces';
import { type FormValues } from '@/types/form.types';

// ISendTestMailResponse: Response from test mail API
interface ISendTestMailResponse {
    messageId?: string;
}

// sendTestMailAction: Submit test mail form
export const sendTestMailAction = async (values: FormValues): Promise<IApiResponse<ISendTestMailResponse>> => {
    const cookieStore = await cookies();
    const authToken = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    return apiCall<ISendTestMailResponse>({
        method: 'POST',
        url: ADMINISTRATOR_API_ROUTES.mail.test,
        authToken,
        body: {
            recipient: values.recipient as string,
            subject: values.subject as string,
            body: values.body as string,
        },
    });
};
