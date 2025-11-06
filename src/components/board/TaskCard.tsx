import React from 'react';
import type { TaskDetailed } from '../../types/api';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';

interface TaskCardProps {
  task: TaskDetailed;
  onClick: () => void; // Tıklandığında Task Modal'ı (detayları) açmak için
}

/**
 * Bir liste (sütun) içinde yer alan tek bir görev kartı ("alt başlık").
 * İsteğinizdeki "checkbox" ve "işlem gören kullanıcı" özellikleri
 * bu kartın *detayında* (TaskModal) yer alacak.
 */
const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  
  // Göreve atanan ilk 3 kişinin avatarlarını al
  const assigneesToShow = task.assignees.slice(0, 3);
  const remainingAssignees = task.assignees.length - assigneesToShow.length;

  return (
    // Koyu tema (Siyah & Sarı) kart
    <div 
      onClick={onClick}
      className="p-3 bg-zinc-900 border border-zinc-700 rounded-md shadow-sm cursor-pointer hover:border-amber-400 transition-all"
    >
      <p className="text-zinc-100 font-medium">{task.title}</p>
      
      {/* Görevle ilgili mini ikonlar (Etiketler, Atananlar vb.) */}
      <div className="flex justify-between items-center mt-3">
        {/* Etiketler (Örn: Düşük, Normal) */}
        <div className="flex gap-1">
          {task.priority === 'HIGH' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-800 text-red-100" title="Yüksek Öncelik">Yüksek</span>
          )}
          {task.priority === 'LOW' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-800 text-blue-100" title="Düşük Öncelik">Düşük</span>
          )}
          {/* TODO: Diğer etiketler (task.tags) buraya eklenebilir */}
        </div>
        
        {/* Atanan Kullanıcı PP Görselleri */}
        <div className="flex -space-x-2">
          {assigneesToShow.map(assignee => (
            <img
              key={assignee.id}
              className="w-6 h-6 rounded-full object-cover border-2 border-zinc-800"
              src={assignee.avatarUrl ? `${API_SOCKET_URL}${assignee.avatarUrl}` : `https://ui-avatars.com/api/?name=${assignee.name}`}
              title={assignee.name}
            />
          ))}
          {remainingAssignees > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 text-xs font-bold border-2 border-zinc-800">
              +{remainingAssignees}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;