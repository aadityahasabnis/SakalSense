import { CourseViewClient } from './CourseViewClient';

export const metadata = {
    title: 'Course Details | SakalSense Admin',
    description: 'View and manage course sections and lessons'
};

interface IPageProps {
    params: Promise<{ id: string }>;
}

const CourseViewPage = async ({ params }: IPageProps) => {
    const { id } = await params;
    return <CourseViewClient courseId={id} />;
};

export default CourseViewPage;
