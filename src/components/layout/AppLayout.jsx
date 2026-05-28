import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { usePageMeta } from '../../hooks/usePageMeta';

export default function AppLayout() {
  const { title, subtitle } = usePageMeta();
  return (
    <div className="min-h-screen bg-cloud-canvas">
      <Sidebar />
      <TopBar title={title} subtitle={subtitle} />
      <main className="ml-[220px] pt-[64px] min-h-screen">
        <div className="p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}