import { CourseFormClient } from '../../CourseFormClient';

export const metadata = {
    title: 'Edit Course | SakalSense Admin',
    description: 'Edit course details'
};

interface IPageProps {
    params: Promise<{ id: string }>;
}

const EditCoursePage = async ({ params }: IPageProps) => {
    const { id } = await params;
    return <CourseFormClient mode="edit" courseId={id} />;
};

export default EditCoursePage;
