// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/TaskComments.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../../services/commentService';
import { reactionService } from '../../services/reactionService';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { formatMessageTimestamp } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/errorHelper';
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
import type { TaskComment, ReactionSummary } from '../../types/api';
import ReactionManager from '../common/ReactionManager';

interface TaskCommentsProps {
  taskId: string;
  taskTitle: string;
  boardId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, taskTitle, boardId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // 1. Yorumları Çekme
  const { data: comments, isLoading } = useQuery<TaskComment[]>({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getComments(taskId),
  });

  // 2. Yorum Ekleme Mutasyonu (Optimistic)
  const addCommentMutation = useMutation({
    mutationFn: (text: string) => commentService.addComment(taskId, { text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['comments', taskId] });
      const previousComments = queryClient.getQueryData<TaskComment[]>(['comments', taskId]) || [];
      
      const optimisticComment: TaskComment = {
        id: `temp-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        author: {
          id: user!.id,
          name: user!.name,
          avatarUrl: user!.avatarUrl,
        },
        reactions: [],
      };

      queryClient.setQueryData<TaskComment[]>(['comments', taskId], [...previousComments, optimisticComment]);
      setNewComment('');
      
      return { previousComments, optimisticComment };
    },
    onSuccess: (realComment, variables, context) => {
      queryClient.setQueryData<TaskComment[]>(['comments', taskId], (oldData) =>
        (oldData || []).map(comment => 
          comment.id === context?.optimisticComment.id ? realComment : comment
        )
      );
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
    onError: (err, variables, context) => {
      toast.error(getErrorMessage(err, 'Yorum eklenemedi.'));
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', taskId], context.previousComments);
      }
      setNewComment(variables);
    },
  });

  // 3. Yorum Silme Mutasyonu
  const deleteCommentMutation = useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: (data, commentId) => {
      queryClient.setQueryData<TaskComment[]>(['comments', taskId], (oldData) =>
        (oldData || []).filter(comment => comment.id !== commentId)
      );
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
      toast.success('Yorum silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Yorum silinemedi.')),
  });
  
  // 4. Yorum Reaksiyonu Mutasyonu (Optimistic)
  const toggleCommentReactionMutation = useMutation({
    mutationFn: (data: { commentId: string, emoji: string }) => 
      reactionService.toggleCommentReaction(data.commentId, { emoji: data.emoji }),
    
    onMutate: async ({ commentId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', taskId] });
      const previousComments = queryClient.getQueryData<TaskComment[]>(['comments', taskId]);

      if (previousComments) {
        queryClient.setQueryData<TaskComment[]>(['comments', taskId], 
          previousComments.map(comment => {
            if (comment.id !== commentId) return comment;
            
            const existingReactionIndex = (comment.reactions || []).findIndex(
              r => r.emoji === emoji && r.userId === user!.id
            );
            
            let newReactions: ReactionSummary[];
            if (existingReactionIndex > -1) {
              newReactions = comment.reactions.filter((r) => !(r.emoji === emoji && r.userId === user!.id));
            } else {
              const newReaction: ReactionSummary = {
                id: `temp-reaction-${Date.now()}`,
                emoji,
                userId: user!.id,
                user: { id: user!.id, name: user!.name }
              };
              newReactions = [...(comment.reactions || []), newReaction];
            }
            return { ...comment, reactions: newReactions };
          })
        );
      }
      return { previousComments };
    },
    onError: (err, vars, context) => {
      toast.error(getErrorMessage(err, 'Tepki verilemedi.'));
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', taskId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  // DÜZELTME (image_82e3d6.png): 'max-h-[60vh]' kaldırıldı
  return (
    <div className="flex flex-col">
      {/* Yorum Listesi */}
      {/* DÜZELTME (image_82e3d6.png): 'overflow-y-auto' kaldırıldı */}
      <div className="flex-1 space-y-4 pr-2">
        {isLoading && <div className="flex justify-center"><Spinner /></div>}
        
        {!isLoading && (!comments || comments.length === 0) && (
          <p className="text-sm text-zinc-400 text-center py-4">Bu görev için henüz yorum yok.</p>
        )}
        
        {comments && comments.map(comment => (
          <div key={comment.id} className="flex items-start space-x-3">
            <img
              className="w-8 h-8 rounded-full object-cover"
              src={comment.author?.avatarUrl ? `${API_SOCKET_URL}${comment.author.avatarUrl}` : `https://ui-avatars.com/api/?name=${comment.author?.name || '?'}`}
              alt={comment.author?.name}
            />
            <div className="flex-1">
              <div className="bg-zinc-700 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-100">{comment.author?.name || 'Bilinmeyen'}</span>
                  {(comment.author?.id === user?.id) && (
                    <button 
                      onClick={() => deleteCommentMutation.mutate(comment.id)} 
                      disabled={deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-200 mt-1">{comment.text}</p>
              </div>
              <div className="text-xs text-zinc-500 ml-2 mt-1 flex items-center">
                <span>{formatMessageTimestamp(comment.createdAt)}</span>
                <ReactionManager
                  reactions={comment.reactions || []}
                  currentUserId={user!.id}
                  onToggleReaction={(emoji) => toggleCommentReactionMutation.mutate({ commentId: comment.id, emoji })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Yorum Yazma Formu */}
      <form onSubmit={handleSubmit} className="flex items-start space-x-3 pt-4 mt-4 border-t border-zinc-700">
        <img
          className="w-8 h-8 rounded-full object-cover"
          src={user?.avatarUrl ? `${API_SOCKET_URL}${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user?.name || '?'}`}
          alt="Siz"
        />
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Yorum yaz..."
          className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400 resize-none"
          rows={2}
        />
        <button 
          type="submit" 
          disabled={addCommentMutation.isPending || !newComment.trim()}
          className="px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 disabled:opacity-50"
        >
          {addCommentMutation.isPending ? <Spinner size="sm" /> : 'Gönder'}
        </button>
      </form>
    </div>
  );
};

export default TaskComments;