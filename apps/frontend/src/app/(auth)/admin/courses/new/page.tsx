import { CourseFormClient } from '../CourseFormClient';

export const metadata = {
    title: 'Create Course | SakalSense Admin',
    description: 'Create a new structured learning course'
};

const NewCoursePage = () => <CourseFormClient mode="create" />;

export default NewCoursePage;
