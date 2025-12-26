import React from 'react';

import Link from 'next/link';

// 404 Not Found page
function NotFound(): React.JSX.Element {
    return (
        <main className='flex min-h-screen flex-col items-center justify-center'>
            <h1 className='text-6xl font-bold'>404</h1>
            <p className='mt-4 text-xl text-muted-foreground'>Page not found</p>
            <Link href='/' className='mt-8 text-primary underline-offset-4 hover:underline'>
                Go back home
            </Link>
        </main>
    );
}

export default NotFound;
