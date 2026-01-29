import { SeriesFormClient } from '../SeriesFormClient';

export const metadata = { title: 'Create Series | SakalSense Admin', description: 'Create a new content series' };

const NewSeriesPage = () => <SeriesFormClient mode="create" />;

export default NewSeriesPage;
