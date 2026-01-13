import { ContentFormClient } from '../ContentFormClient';

export const metadata = { title: 'Create Content | SakalSense Admin', description: 'Create new content - article, tutorial, project, or more' };

const NewContentPage = () => <ContentFormClient mode="create" />;

export default NewContentPage;
