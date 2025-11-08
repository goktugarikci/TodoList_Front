// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/TaskCard.tsx
import React, { Fragment } from 'react';
import type { TaskDetailed } from '../../types/api';
import { API_SOCKET_URL } from '../../contexts/AuthContext'; 
import { Menu, Transition } from '@headlessui/react';
import { ModalView } from '../../pages/BoardDetailPage';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAvatarUrl } from '../../utils/getAvatarUrl';

interface TaskCardProps {
  task: TaskDetailed;
  onOpenModal: (view: ModalView) => void; 
  onToggleComplete: () => void; 
  onDeleteTask: () => void; 
  onToggleChecklistItem: (itemId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onOpenModal, 
  onToggleComplete, 
  onDeleteTask, 
  onToggleChecklistItem 
}) => {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { 
      type: 'Task',
      listId: task.taskListId 
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = task.approvalStatus === 'APPROVED';
  const attachmentCount = task._count?.attachments ?? 0;
  const hasDescription = !!task.description && task.description.trim().length > 0;
  const assigneesToShow = (task.assignees || []).slice(0, 3);
  const remainingAssignees = (task.assignees || []).length - assigneesToShow.length;
  const checklistItems = task.checklistItems || [];
  const commentCount = task._count?.comments ?? 0;
  
  const cardBorderClass = isCompleted ? 'border-green-600' : 'border-zinc-700 hover:border-amber-400';
  const cardBgClass = isCompleted ? 'bg-zinc-800 opacity-80' : 'bg-zinc-900'; 
  const toggleCompleteText = isCompleted ? "Tamamlanmadı Olarak İşaretle" : "Tamamlandı Olarak İşaretle";

  return (
    <div ref={setNodeRef} style={style}>
      <Menu as="div" className="relative w-full">
        {({ open }) => (
          <>
            <Menu.Button
              as="div"
              className={`p-3 ${cardBgClass} border ${open ? 'border-amber-400' : cardBorderClass} rounded-md shadow-sm cursor-pointer transition-all space-y-3 w-full text-left`}
            >
              {/* 1. Başlık, Hızlı Onaylama ve Sürükleme İkonu */}
              <div className="flex justify-between items-start">
                <button
                  ref={setActivatorNodeRef}
                  {...listeners}
                  {...attributes}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1 mr-1 text-zinc-500 hover:text-zinc-100 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  title="Görevi sürükle"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <p className={`flex-1 font-medium ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>
                  {task.title}
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-shrink-0 ml-2 w-5 h-5 flex items-center justify-center rounded-full"
                  title={toggleCompleteText}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 flex items-center justify-center bg-green-600 rounded-full" title="Tamamlandı">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-500 group-hover:border-amber-400 transition-colors"></div>
                  )}
                </button>
              </div>

              {/* 2. Açıklama Metni (Varsa) */}
              {hasDescription && (
                <p className="text-sm text-zinc-400 line-clamp-2" title={task.description!}>
                  {task.description}
                </p>
              )}
              
              {/* 3. Alt Görev Listesi (Varsa) */}
              {checklistItems.length > 0 && (
                <div className="mt-2 space-y-1 pt-2 border-t border-zinc-700/50">
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center text-sm pl-1 group">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleChecklistItem(item.id); }}
                        onMouseDown={(e) => e.stopPropagation()} 
                        className="flex-shrink-0 mr-2 rounded-full p-0.5 hover:bg-zinc-700"
                        title={item.isCompleted ? "Geri al" : "Tamamla"}
                      >
                        {item.isCompleted ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                      <span 
                        className={`flex-1 ${item.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'} transition-colors`}
                        onClick={(e) => e.stopPropagation()} 
                        onMouseDown={(e) => e.stopPropagation()} 
                      >
                        {item.text}
                      </span>
                      {(item.assignees || []).map(assignee => (
                        <img
                          key={assignee.id}
                          className="w-4 h-4 rounded-full object-cover ml-1 border border-zinc-900"
                          src={getAvatarUrl(assignee.avatarUrl)}
                          title={`Atanan: ${assignee.name}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 4. Alt Bilgi */}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {/* ... (Etiketler) ... */}
                  </div>
                  {attachmentCount > 0 && (
                    <div className="flex items-center text-sm text-zinc-400" title={`${attachmentCount} ek dosya`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 008.486 8.486L20.5 13"></path></svg>
                      <span>{attachmentCount}</span>
                    </div>
                  )}
                  {commentCount > 0 && (
                    <div className="flex items-center text-sm text-zinc-400" title={`${commentCount} yorum`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      <span>{commentCount}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex -space-x-2">
                  {/* ... (Atananlar) ... */}
                </div>
              </div>
            </Menu.Button>

            {/* Açılır Menü İçeriği */}
            <Transition as={Fragment} /* ... */ >
              <Menu.Items 
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-zinc-700 rounded-md bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-700 z-10"
              >
                
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('details')} 
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Görevi Düzenle
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('assignees')} 
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Kişi Ata / Yönet
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('checklist')} 
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Alt Görevleri Yönet
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('attachments')}
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 008.486 8.486L20.5 13"></path></svg>
                        Görsel Ekle / Yönet
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('comments')}
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        Yorumları Göster
                      </button>
                    )}
                  </Menu.Item>
                  
                  {/* YENİ: Zaman Takibi Menü Öğesi */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onOpenModal('time')}
                        className={`${active ? 'bg-zinc-700 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Zaman Takibi
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="px-1 py-1">
                   <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onToggleComplete}
                        className={`${active ? 'bg-zinc-700' : ''} ${isCompleted ? 'text-zinc-300' : 'text-green-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {toggleCompleteText}
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDeleteTask}
                        className={`${active ? 'bg-red-600 text-white' : 'text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Görevi Sil
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};

export default TaskCard;