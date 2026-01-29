'use client';
// =============================================
// CommentSection - Display and manage comments with nested replies
// =============================================

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageSquare, MoreVertical, Pencil, Trash2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    createComment,
    deleteComment,
    getContentComments,
    toggleCommentLike,
    updateComment,
} from '@/server/actions/engagement/commentActions';
import { cn } from '@/lib/utils';

interface ICommentSectionProps {
    contentId: string;
    userId?: string;
}

interface IComment {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    likeCount: number;
    isLiked?: boolean;
    user: {
        id: string;
        fullName: string;
        avatarLink?: string | null;
    };
    replies?: IComment[];
}

export const CommentSection = ({ contentId, userId }: ICommentSectionProps) => {
    // Fetch comments
    const { data: comments = [], isLoading } = useQuery<IComment[]>({
        queryKey: ['content-comments', contentId],
        queryFn: async () => {
            const result = await getContentComments(contentId);
            if (!result.success || !result.data) return [];
            return result.data as unknown as IComment[];
        },
    });

    if (isLoading) {
        return (
            <div className='space-y-4'>
                <h2 className='text-2xl font-bold'>Comments</h2>
                <p className='text-muted-foreground'>Loading comments...</p>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-2xl font-bold'>
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h2>
            </div>

            {/* Comment Form */}
            {userId && <CommentForm contentId={contentId} />}

            {/* Comments List */}
            {comments.length === 0 ? (
                <p className='py-8 text-center text-muted-foreground'>
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <div className='space-y-6'>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            contentId={contentId}
                            userId={userId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================
// CommentForm - Create or edit comment
// =============================================
interface ICommentFormProps {
    contentId: string;
    parentId?: string;
    initialValue?: string;
    commentId?: string;
    onCancel?: () => void;
    onSuccess?: () => void;
}

const CommentForm = ({
    contentId,
    parentId,
    initialValue = '',
    commentId,
    onCancel,
    onSuccess,
}: ICommentFormProps) => {
    const [content, setContent] = useState(initialValue);
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: { content: string; parentId?: string }) =>
            createComment({ contentId, body: data.content, parentId: data.parentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
            setContent('');
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { commentId: string; content: string }) =>
            updateComment(data.commentId, data.content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
            onSuccess?.();
        },
    });

    const handleSubmit = () => {
        if (!content.trim()) return;

        if (commentId) {
            updateMutation.mutate({ commentId, content });
        } else {
            createMutation.mutate({ content, parentId });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className='space-y-3'>
            <Textarea
                placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className='resize-none'
            />
            <div className='flex items-center gap-2'>
                <Button onClick={handleSubmit} disabled={isLoading || !content.trim()} size='sm'>
                    {isLoading ? 'Posting...' : commentId ? 'Update' : 'Post Comment'}
                </Button>
                {onCancel && (
                    <Button onClick={onCancel} variant='ghost' size='sm'>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
};

// =============================================
// CommentItem - Individual comment with replies
// =============================================
interface ICommentItemProps {
    comment: IComment;
    contentId: string;
    userId?: string;
    isReply?: boolean;
}

const CommentItem = ({ comment, contentId, userId, isReply = false }: ICommentItemProps) => {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const queryClient = useQueryClient();

    const isOwnComment = userId === comment.user.id;

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteComment(comment.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
        },
    });

    // Like mutation
    const likeMutation = useMutation({
        mutationFn: () => toggleCommentLike(comment.id),
        onMutate: async () => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['content-comments', contentId] });
            const previousComments = queryClient.getQueryData(['content-comments', contentId]);

            queryClient.setQueryData(['content-comments', contentId], (old: IComment[] | undefined) => {
                if (!old) return old;
                return updateCommentInTree(old, comment.id, {
                    likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1,
                    isLiked: !comment.isLiked,
                });
            });

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['content-comments', contentId], context.previousComments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
        },
    });

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this comment?')) {
            deleteMutation.mutate();
        }
    };

    return (
        <div className={cn('space-y-3', isReply && 'ml-12')}>
            <div className='flex gap-3'>
                {/* Avatar */}
                {comment.user.avatarLink ? (
                    <img
                        src={comment.user.avatarLink}
                        alt={comment.user.fullName}
                        className='h-10 w-10 rounded-full'
                    />
                ) : (
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
                        <User className='h-5 w-5' />
                    </div>
                )}

                {/* Comment Content */}
                <div className='flex-1 space-y-2'>
                    {/* Header */}
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <span className='font-medium'>{comment.user.fullName}</span>
                            <span className='text-sm text-muted-foreground'>
                                {formatRelativeTime(new Date(comment.createdAt))}
                                {comment.isEdited && ' (edited)'}
                            </span>
                        </div>

                        {/* Actions Menu */}
                        {isOwnComment && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                                        <MoreVertical className='h-4 w-4' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Pencil className='mr-2 h-4 w-4' />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleDelete}
                                        className='text-destructive'
                                    >
                                        <Trash2 className='mr-2 h-4 w-4' />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Comment Body */}
                    {isEditing ? (
                        <CommentForm
                            contentId={contentId}
                            initialValue={comment.content}
                            commentId={comment.id}
                            onCancel={() => setIsEditing(false)}
                            onSuccess={() => setIsEditing(false)}
                        />
                    ) : (
                        <p className='text-sm'>{comment.content}</p>
                    )}

                    {/* Action Buttons */}
                    {!isEditing && (
                        <div className='flex items-center gap-4'>
                            {/* Like Button */}
                            <button
                                onClick={() => likeMutation.mutate()}
                                disabled={!userId}
                                className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                <Heart
                                    className={cn(
                                        'h-4 w-4',
                                        comment.isLiked && 'fill-red-500 text-red-500'
                                    )}
                                />
                                {comment.likeCount > 0 && (
                                    <span>{comment.likeCount.toLocaleString()}</span>
                                )}
                            </button>

                            {/* Reply Button */}
                            {!isReply && userId && (
                                <button
                                    onClick={() => setIsReplying(!isReplying)}
                                    className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
                                >
                                    <MessageSquare className='h-4 w-4' />
                                    Reply
                                </button>
                            )}

                            {/* Toggle Replies */}
                            {!isReply && comment.replies && comment.replies.length > 0 && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className='text-sm text-muted-foreground hover:text-foreground'
                                >
                                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                                    {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {isReplying && (
                        <div className='mt-3'>
                            <CommentForm
                                contentId={contentId}
                                parentId={comment.id}
                                onCancel={() => setIsReplying(false)}
                                onSuccess={() => setIsReplying(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
                <div className='space-y-4 border-l-2 border-muted pl-4'>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            contentId={contentId}
                            userId={userId}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================
// Helper Functions
// =============================================

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Recursively update a comment in the tree
function updateCommentInTree(
    comments: IComment[],
    commentId: string,
    updates: Partial<IComment>
): IComment[] {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return { ...comment, ...updates };
        }
        if (comment.replies) {
            return {
                ...comment,
                replies: updateCommentInTree(comment.replies, commentId, updates),
            };
        }
        return comment;
    });
}
