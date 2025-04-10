
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Trash2, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { TeamPoll, TeamPollOption, votePoll, updatePollStatus, deletePoll } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamPollCardProps {
  poll: TeamPoll;
  authorName?: string;
}

const POLL_COLORS = [
  'bg-blue-100/70 hover:bg-blue-200/80 backdrop-blur-sm border border-blue-200/50', 
  'bg-purple-100/70 hover:bg-purple-200/80 backdrop-blur-sm border border-purple-200/50', 
  'bg-orange-100/70 hover:bg-orange-200/80 backdrop-blur-sm border border-orange-200/50',
  'bg-green-100/70 hover:bg-green-200/80 backdrop-blur-sm border border-green-200/50', 
];

const TeamPollCard: React.FC<TeamPollCardProps> = ({
  poll,
  authorName
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAuthor = user?.id === poll.author_id;
  
  const glassStyle = "bg-opacity-60 backdrop-filter backdrop-blur-sm shadow-lg border border-opacity-30";
  
  const voteMutation = useMutation({
    mutationFn: votePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
    },
    onError: (error) => {
      toast.error(`Error voting: ${error.message}`);
    },
  });
  
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      updatePollStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      toast.success(poll.active ? 'Poll closed' : 'Poll reopened');
    },
    onError: (error) => {
      toast.error(`Error updating poll status: ${error.message}`);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      toast.success('Poll deleted');
    },
    onError: (error) => {
      toast.error(`Error deleting poll: ${error.message}`);
    },
  });
  
  const handleVote = (optionId: string) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      return;
    }
    
    if (!poll.active) {
      toast.error('This poll is closed');
      return;
    }
    
    voteMutation.mutate({
      poll_id: poll.id,
      option_id: optionId,
      user_id: user.id
    });
  };
  
  const handleStatusChange = () => {
    if (!isAuthor) return;
    
    statusMutation.mutate({
      id: poll.id,
      active: !poll.active
    });
  };
  
  const handleDelete = () => {
    if (!isAuthor) return;
    
    if (confirm('Are you sure you want to delete this poll?')) {
      deleteMutation.mutate(poll.id);
    }
  };
  
  // Check if the user has voted for a specific option
  const hasVotedFor = (optionId: string) => {
    if (!user || !poll.votes) return false;
    return poll.votes.some(vote => vote.user_id === user.id && vote.option_id === optionId);
  };
  
  // Check if the user has voted at all in this poll
  const hasVoted = () => {
    if (!user || !poll.votes) return false;
    return poll.votes.some(vote => vote.user_id === user.id);
  };
  
  // Prepare data for the chart
  const chartData = poll.options?.map(option => ({
    name: option.option_text,
    votes: option.vote_count || 0
  })) || [];
  
  // Get total votes
  const totalVotes = poll.votes?.length || 0;
  
  return (
    <Card className={`${poll.color || POLL_COLORS[0]} ${glassStyle} p-4 rounded-lg min-h-[200px] flex flex-col`}>
      <div className="flex justify-between items-start mb-2">
        {poll.active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        )}
        
        <div className="flex gap-2">
          {isAuthor && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-amber-500" onClick={handleStatusChange}>
                {poll.active ? <AlertCircle size={16} /> : <Check size={16} />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={handleDelete}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-1">{poll.question}</h3>
        <p className="text-xs text-gray-600">
          {poll.multiple_choice ? 'Multiple choices allowed' : 'Select one option'}
        </p>
      </div>
      
      <div className="flex-grow">
        <div className="grid gap-2 mb-4">
          {poll.options?.map((option) => (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={cn(
                "p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-all",
                hasVotedFor(option.id) 
                  ? "bg-blue-200/50 border-blue-300" 
                  : "bg-white/50 border-gray-200 hover:bg-blue-50"
              )}
            >
              <div className="flex items-center">
                <div className="mr-2">
                  {hasVotedFor(option.id) ? (
                    poll.multiple_choice ? <CheckCheck size={18} /> : <Check size={18} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-gray-300" />
                  )}
                </div>
                <span>{option.option_text}</span>
              </div>
              
              <div className="flex flex-shrink-0 items-center">
                <span className="text-sm font-semibold mr-2">{option.vote_count || 0}</span>
                <div className="flex -space-x-1 overflow-hidden">
                  {option.voters?.slice(0, 3).map(voter => (
                    <Avatar key={voter.id} className="h-6 w-6 border-2 border-white">
                      {voter.avatar_url ? (
                        <AvatarImage src={voter.avatar_url} alt={voter.first_name || 'User'} />
                      ) : (
                        <AvatarFallback>
                          {voter.first_name?.[0] || '?'}{voter.last_name?.[0] || ''}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {(option.voters?.length || 0) > 3 && (
                    <Avatar className="h-6 w-6 border-2 border-white">
                      <AvatarFallback>
                        +{(option.voters?.length || 0) - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(totalVotes > 0 && poll.options && poll.options.length > 0) && (
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="votes" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>{new Date(poll.created_at).toLocaleDateString()}</span>
        {authorName && <span className="italic">- {authorName}</span>}
      </div>
    </Card>
  );
};

export default TeamPollCard;
