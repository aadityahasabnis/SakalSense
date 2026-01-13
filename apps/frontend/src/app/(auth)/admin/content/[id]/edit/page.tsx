import { ContentFormClient } from '../../ContentFormClient';

interface IEditPageProps { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Content | SakalSense Admin', description: 'Edit your content' };

const EditContentPage = async ({ params }: IEditPageProps) => {
    const { id } = await params;
    return <ContentFormClient mode="edit" contentId={id} />;
};

export default EditContentPage;
